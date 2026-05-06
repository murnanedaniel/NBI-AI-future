"""Pilot v4 — arXiv fetch + HTML-first paper ingest + section extraction, all timed.

Splits the steps the spec lists into five separately-timed stages:
  1. arxiv_query_background  (first arXiv query, returns the 10 background abstracts)
  2. arxiv_query_ongoing     (reuses result for tiering; logged for visibility)
  3. html_fetch              (Patch 5 primary path — arxiv.org/html/<id>)
  4. pdf_fetch_pdftotext     (fallback — only when HTML 404/unrenderable)
  5. section_extract         (abstract / intro / conclusion)

Canonical shared cache at artifacts/corpus/<id>/.
"""

from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import xml.etree.ElementTree as ET

import requests

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _timing import stage, mark  # noqa: E402

ARTIFACTS = pathlib.Path(
    "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts"
)
CORPUS = ARTIFACTS / "corpus"
BASE = ARTIFACTS / "phase_a"
ARXIV_NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}
UA = "NBI-pilot-pipeline/0.4 (contact danieltmurnane@gmail.com)"

SECTION_CATEGORIES: dict[str, list[str]] = {
    "Cosmic Dawn Center (DAWN)":               ["astro-ph.CO", "astro-ph.GA", "astro-ph.HE", "astro-ph.IM", "astro-ph.SR", "gr-qc"],
    "Dark Cosmology Centre (DARK)":            ["astro-ph.CO", "astro-ph.GA", "astro-ph.HE", "gr-qc", "hep-ph"],
    "Astrophysics and Planetary Science":      ["astro-ph.EP", "astro-ph.GA", "astro-ph.HE", "astro-ph.IM", "astro-ph.SR", "physics.space-ph"],
    "Niels Bohr International Academy":        ["astro-ph.CO", "astro-ph.HE", "gr-qc", "hep-th", "hep-ph", "cond-mat.stat-mech", "quant-ph"],
    "Theoretical Particle Physics and Cosmology": ["hep-th", "hep-ph", "gr-qc", "astro-ph.CO", "astro-ph.HE"],
    "Experimental Subatomic Physics":          ["hep-ex", "nucl-ex", "hep-ph", "physics.ins-det", "physics.acc-ph"],
    "Quantum Optics":                          ["quant-ph", "physics.optics", "physics.atom-ph", "cond-mat.mes-hall", "cond-mat.quant-gas"],
    "Condensed Matter Physics":                ["cond-mat.mes-hall", "cond-mat.str-el", "cond-mat.supr-con", "cond-mat.quant-gas", "cond-mat.stat-mech", "cond-mat.soft", "cond-mat.dis-nn", "cond-mat.mtrl-sci", "quant-ph"],
    "Biophysics":                              ["physics.bio-ph", "cond-mat.soft", "q-bio.BM", "q-bio.CB", "q-bio.SC", "q-bio.PE", "q-bio.TO", "q-bio.QM"],
    "Climate and Geophysics":                  ["physics.geo-ph", "physics.ao-ph", "physics.flu-dyn", "physics.ocean-ph"],
}

MIN_FILTERED = 5
CHAR_BUDGET = 48_000


def nfkd(s: str) -> str:
    """Patch 6 — NFKD + strip combining chars. ASCII-folded lowercase."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s


def sleep_rate_limit(last_ts: float, min_gap: float = 5.0) -> float:
    now = time.time()
    dt = now - last_ts
    if dt < min_gap:
        time.sleep(min_gap - dt)
    return time.time()


def nonempty(p: pathlib.Path) -> bool:
    return p.exists() and p.stat().st_size > 0


def step1_cache_complete(out_dir: pathlib.Path) -> bool:
    bg_idx = out_dir / "background_candidates" / "index.json"
    ing = out_dir / "ingest_log.json"
    auth = out_dir / "authors.json"
    if not (nonempty(bg_idx) and nonempty(ing) and nonempty(auth)):
        return False
    try:
        ingest = json.loads(ing.read_text())
    except Exception:
        return False
    papers = ingest.get("papers", [])
    if not papers:
        if ingest.get("pure_fallback"):
            return True
        return False
    for pm in papers:
        if pm.get("tier") == "pure_abstract":
            continue
        i = pm["paper_index"]
        src = pm.get("fetch_method", "pdf_pdftotext")
        if src == "html_native":
            if not nonempty(out_dir / "papers" / f"paper_{i}.html"):
                return False
        else:
            if not nonempty(out_dir / "papers" / f"paper_{i}.pdf"):
                return False
        if not nonempty(out_dir / "papers" / f"paper_{i}_extracted.json"):
            return False
    return True


def author_position(authors: list[tuple[str, str]], full_name: str) -> int | None:
    """Patch 6 — NFKD normalise both sides before comparing."""
    full_norm = nfkd(full_name).lower()
    parts = full_norm.strip().split()
    first = parts[0]
    last = parts[-1]
    first_initial = first[0].upper() if first else ""
    for i, (name, _aff) in enumerate(authors, 1):
        if not name:
            continue
        n_norm = nfkd(name).strip().lower()
        if n_norm == full_norm:
            return i
        if "," in n_norm:
            ln, rest = n_norm.split(",", 1)
            rest = rest.strip()
            if ln.strip() == last and (
                rest == first or (first_initial and rest.upper().startswith(first_initial))
            ):
                return i
            continue
        toks = n_norm.split()
        if toks and toks[-1] == last:
            fn = toks[0]
            if fn == first:
                return i
            if first_initial and fn.rstrip(".").upper() == first_initial:
                return i
    return None


def tier_of(pos: int, n: int) -> str:
    if pos <= 3 or pos >= n - 2:
        return "A"
    if pos <= 5 or pos >= n - 4:
        return "B"
    return "C"


def build_arxiv_query(author_query: str, categories: list[str] | None) -> str:
    if not categories:
        return author_query
    cat_or = " OR ".join(f"cat:{c}" for c in categories)
    return f"{author_query} AND ({cat_or})"


def search_arxiv(query: str, max_results: int = 100) -> list[dict]:
    url = (
        "http://export.arxiv.org/api/query?search_query="
        + urllib.parse.quote(query)
        + f"&sortBy=submittedDate&sortOrder=descending&max_results={max_results}"
    )
    for attempt in range(7):
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=60)
            if r.status_code == 429:
                wait = 30 * (2 ** attempt)
                print(f"    arXiv 429 backoff {wait}s (attempt {attempt+1}/7)", flush=True)
                time.sleep(wait)
                continue
            r.raise_for_status()
            break
        except requests.exceptions.RequestException as ex:
            if attempt == 6:
                raise
            wait = 30 * (2 ** attempt)
            print(f"    arXiv exception {ex} backoff {wait}s", flush=True)
            time.sleep(wait)
    else:
        raise RuntimeError("arXiv exhausted retries")
    root = ET.fromstring(r.text)
    entries = []
    for e in root.findall("atom:entry", ARXIV_NS):
        title = (e.findtext("atom:title", default="", namespaces=ARXIV_NS) or "").strip()
        summary = (e.findtext("atom:summary", default="", namespaces=ARXIV_NS) or "").strip()
        published = e.findtext("atom:published", default="", namespaces=ARXIV_NS) or ""
        aid = (e.findtext("atom:id", default="", namespaces=ARXIV_NS) or "").strip()
        authors = []
        for a in e.findall("atom:author", ARXIV_NS):
            nm = (a.findtext("atom:name", default="", namespaces=ARXIV_NS) or "").strip()
            aff = (a.findtext("arxiv:affiliation", default="", namespaces=ARXIV_NS) or "").strip()
            authors.append((nm, aff))
        cats = []
        for c in e.findall("atom:category", ARXIV_NS):
            term = c.attrib.get("term", "")
            if term:
                cats.append(term)
        pdf_url = None
        for link in e.findall("atom:link", ARXIV_NS):
            if link.attrib.get("title") == "pdf":
                pdf_url = link.attrib.get("href")
        if pdf_url is None and aid:
            pdf_url = aid.replace("/abs/", "/pdf/") + ".pdf" if "/abs/" in aid else aid + ".pdf"
        entries.append({
            "arxiv_id": aid, "title": title.replace("\n", " ").strip(),
            "summary": summary, "published": published, "authors": authors,
            "categories": cats, "pdf_url": pdf_url,
        })
    return entries


def bare_arxiv_id(arxiv_id_url: str) -> str:
    """Turn 'http://arxiv.org/abs/2501.01234v2' -> '2501.01234v2'."""
    if "/abs/" in arxiv_id_url:
        return arxiv_id_url.rsplit("/abs/", 1)[1]
    return arxiv_id_url


def fetch_html(arxiv_id_url: str) -> tuple[bytes | None, int, str]:
    """Patch 5 — try https://arxiv.org/html/<id>. Returns (bytes, status, url_tried)."""
    bid = bare_arxiv_id(arxiv_id_url)
    url = f"https://arxiv.org/html/{bid}"
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=60)
    except requests.exceptions.RequestException as ex:
        return None, -1, url
    if r.status_code != 200:
        return None, r.status_code, url
    # Guard: arXiv sometimes returns 200 with an HTML-generation-failed stub.
    # The real rendered HTML is ~50KB+ and contains a <section> tag. Bail if not.
    body = r.content
    txt_low = body[:4000].decode("utf-8", errors="replace").lower()
    if b"<section" not in body and b"\"ltx_section\"" not in body:
        # No semantic structure. Fall back.
        return None, 200, url  # treat as 200-but-no-real-html
    if "no html for this paper" in txt_low or "not found" in txt_low[:2000] and len(body) < 8000:
        return None, 200, url
    return body, 200, url


def parse_html_sections(html_bytes: bytes) -> dict:
    """Extract abstract + intro + conclusion from arXiv LaTeX-rendered HTML.

    arxiv.org/html uses LaTeXML output with class='ltx_section' etc.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html_bytes, "html.parser")
    for tag in soup.find_all(["script", "style"]):
        tag.decompose()

    # abstract
    abstract = None
    abs_div = soup.find(class_=re.compile(r"ltx_abstract"))
    if abs_div:
        abstract = re.sub(r"\s+", " ", abs_div.get_text(" ", strip=True))
        abstract = re.sub(r"^\s*Abstract[:\.\s]*", "", abstract)

    # introduction and conclusion — scan top-level ltx_section nodes by title
    intro, conclusion = None, None
    for sec in soup.find_all(class_=re.compile(r"ltx_section")):
        title_tag = sec.find(class_=re.compile(r"ltx_title"))
        title_txt = (title_tag.get_text(" ", strip=True) if title_tag else "").strip()
        low = title_txt.lower()
        body = re.sub(r"\s+", " ", sec.get_text(" ", strip=True))
        if intro is None and ("introduction" in low or low.endswith(" introduction")):
            intro = body[:18_000]
        if "conclusion" in low or "summary" in low or "discussion" in low or "outlook" in low:
            if conclusion is None:
                conclusion = body[:12_000]

    return {"abstract": abstract, "intro": intro, "conclusion": conclusion}


def pdf_to_text(pdf: pathlib.Path) -> str:
    txt = pdf.with_suffix(".txt")
    if not txt.exists():
        subprocess.run(
            ["pdftotext", "-layout", "-enc", "UTF-8", str(pdf), str(txt)],
            check=True,
        )
    return txt.read_text(errors="replace")


def find_section(text, start_patterns, end_patterns, max_chars=20_000):
    for sp in start_patterns:
        m = re.search(sp, text, flags=re.IGNORECASE | re.MULTILINE)
        if m:
            start = m.start()
            rest = text[start:]
            end = len(rest)
            for ep in end_patterns:
                em = re.search(ep, rest[50:], flags=re.IGNORECASE | re.MULTILINE)
                if em:
                    end = em.start() + 50
                    break
            return rest[: min(end, max_chars)]
    return None


def pdf_extract(text: str) -> dict:
    # abstract
    probe = text[:6000]
    abstract = None
    for sp in [r"^\s*ABSTRACT\b", r"^\s*A B S T R A C T\b", r"^\s*Abstract\b"]:
        m = re.search(sp, probe, flags=re.MULTILINE)
        if m:
            rest = probe[m.end():]
            end_patterns = [
                r"\n\s*(Key words|Keywords)\b",
                r"\n\s*1\.\s+Introduction\b",
                r"\n\s*I\.\s+INTRODUCTION\b",
                r"\n\s*INTRODUCTION\b",
                r"\n\s*\d+\.\s*Introduction\b",
            ]
            end = len(rest)
            for ep in end_patterns:
                em = re.search(ep, rest, flags=re.IGNORECASE)
                if em:
                    end = em.start()
                    break
            abstract = rest[: min(end, 5000)].strip()
            break
    if abstract is None:
        abstract = probe[:2500]
    intro = find_section(text,
        [r"^\s*1\.?\s+Introduction\b", r"^\s*[IVX]+\.?\s+INTRODUCTION\b", r"^\s*INTRODUCTION\b"],
        [r"^\s*2\.?\s+[A-Z]", r"^\s*[IVX]+\.?\s+[A-Z][A-Z]+", r"^\s*Methods\b",
         r"^\s*Observations\b", r"^\s*Data\b", r"^\s*Sample\b", r"^\s*Design\b", r"^\s*Results\b"],
        max_chars=12_000)
    conclusion = find_section(text,
        [r"^\s*\d+\.?\s+(Summary|Conclusions?|Discussion and Conclusions?|Summary and Conclusions?)\b",
         r"^\s*[IVX]+\.?\s+(SUMMARY|CONCLUSIONS?|DISCUSSION)\b",
         r"^\s*(Summary|Conclusions?|Discussion and Conclusions?|Summary and Conclusions?)\b",
         r"^\s*(SUMMARY|CONCLUSIONS?|OUTLOOK)\b",
         r"\b[IVX]+\.\s+(DISCUSSION|CONCLUSIONS?|SUMMARY|OUTLOOK)\b",
         r"\b\d+\.\s+(Discussion|Conclusions?|Summary|Outlook)\b"],
        [r"^\s*Acknowledgements?\b", r"^\s*Acknowledgments?\b", r"^\s*ACKNOWLEDG(E)?MENTS?\b",
         r"^\s*References\b", r"^\s*REFERENCES\b", r"^\s*Bibliography\b",
         r"^\s*Appendix\b", r"^\s*APPENDIX\b"],
        max_chars=12_000)
    return {"abstract": abstract, "intro": intro, "conclusion": conclusion}


def assemble_payload(parts: dict) -> dict:
    chunks = []
    if parts.get("abstract"):
        chunks.append(("ABSTRACT", parts["abstract"]))
    if parts.get("intro"):
        chunks.append(("INTRODUCTION", parts["intro"][:18_000]))
    if parts.get("conclusion"):
        chunks.append(("CONCLUSION", parts["conclusion"][:12_000]))
    out_parts = []
    used = 0
    for label, body in chunks:
        head = f"\n=== {label} ===\n"
        room = CHAR_BUDGET - used - len(head)
        if room <= 200:
            break
        snippet = body[:room]
        out_parts.append(head + snippet)
        used += len(head) + len(snippet)
    return {
        "payload": "".join(out_parts),
        "has_abstract": bool(parts.get("abstract")),
        "has_intro": bool(parts.get("intro")),
        "has_conclusion": bool(parts.get("conclusion")),
        "payload_chars": used,
    }


def download_pdf(url: str, dest: pathlib.Path) -> int:
    r = requests.get(url, headers={"User-Agent": UA}, timeout=120, stream=True)
    r.raise_for_status()
    total = 0
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=64 * 1024):
            if chunk:
                f.write(chunk)
                total += len(chunk)
    return total


def select_lead_papers(tagged: list[dict], k: int = 3):
    for e in tagged:
        e["tier"] = tier_of(e["author_position"], e["n_authors"])
    tier_a = [e for e in tagged if e["tier"] == "A"]
    tier_b = [e for e in tagged if e["tier"] == "B"]
    tier_c = [e for e in tagged if e["tier"] == "C"]
    chosen: list[dict] = []
    for e in tier_a:
        if len(chosen) >= k: break
        chosen.append(e)
    for e in tier_b:
        if len(chosen) >= k: break
        chosen.append(e)
    source_tag = "tier-A"
    if any(c["tier"] == "B" for c in chosen):
        source_tag = "tier-A+B"
    if len(chosen) < k:
        for e in tier_c:
            if len(chosen) >= k: break
            chosen.append(e)
        if any(c["tier"] == "C" for c in chosen):
            source_tag = "tier-A+B+C-fallback"
    chosen_ids = {e["arxiv_id"] for e in chosen}
    log = [{
        "arxiv_id": e["arxiv_id"], "title": e["title"][:140],
        "published": e["published"][:10], "author_position": e["author_position"],
        "n_authors": e["n_authors"], "tier": e["tier"],
        "accepted": e["arxiv_id"] in chosen_ids,
    } for e in tagged]
    return chosen, log, source_tag


def process_person(person: dict, last_ts: float) -> float:
    pid = person["id"]
    full_name = person["arxiv_name"]
    section = person["section"]
    author_query = person["arxiv_query"]
    categories = SECTION_CATEGORIES.get(section, [])
    filtered_query = build_arxiv_query(author_query, categories)
    out_dir = CORPUS / pid
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "background_candidates").mkdir(exist_ok=True)
    (out_dir / "papers").mkdir(exist_ok=True)

    print(f"\n=== {full_name} ({pid}) · {section} ===", flush=True)

    if step1_cache_complete(out_dir):
        print(f"  cache_hit: {pid}", flush=True)
        return last_ts

    print(f"  categories = {categories}", flush=True)
    print(f"  arxiv_query = {filtered_query}", flush=True)

    # ---------- STAGE 1: arxiv_query_background ----------
    last_ts = sleep_rate_limit(last_ts, 5.0)
    with stage("1_arxiv_background", pid, extra={"query": filtered_query}) as rec:
        entries = search_arxiv(filtered_query, max_results=100)
        rec["extra"]["n_returned"] = len(entries)
    filter_used = "section-categories"
    manual_review = False
    print(f"  arXiv returned {len(entries)} entries with category filter", flush=True)

    if len(entries) < MIN_FILTERED:
        print(f"  PATCH 3: <{MIN_FILTERED} hits; retrying without category filter", flush=True)
        last_ts = sleep_rate_limit(last_ts, 5.0)
        with stage("1_arxiv_background_fallback", pid, extra={"query": author_query}) as rec:
            entries = search_arxiv(author_query, max_results=100)
            rec["extra"]["n_returned"] = len(entries)
        filter_used = "author-only-fallback"
        manual_review = True
        print(f"  arXiv (no-cat fallback) returned {len(entries)} entries", flush=True)

    background = entries[:10]
    print(f"  background: keeping {len(background)} most recent abstracts", flush=True)
    bg_meta = []
    for i, e in enumerate(background, 1):
        pos = author_position(e["authors"], full_name)
        bg_meta.append({
            "idx": i, "arxiv_id": e["arxiv_id"], "title": e["title"],
            "published": e["published"], "author_position": pos,
            "n_authors": len(e["authors"]), "categories": e.get("categories", []),
            "abstract": e["summary"],
        })
        (out_dir / "background_candidates" / f"abstract_{i}.json").write_text(
            json.dumps(bg_meta[-1], indent=2)
        )
    (out_dir / "background_candidates" / "index.json").write_text(
        json.dumps({
            "person": full_name, "pid": pid,
            "source": "arxiv_with_section_category_filter"
                      if filter_used == "section-categories"
                      else "arxiv_author_only_fallback",
            "filter_used": filter_used, "manual_review": manual_review,
            "abstracts": bg_meta,
        }, indent=2)
    )

    # ---------- STAGE 2: arxiv_query_ongoing (tiering; uses same entries) ----------
    with stage("2_arxiv_ongoing", pid) as rec:
        tagged = []
        for e in entries:
            pos = author_position(e["authors"], full_name)
            if pos is None:
                continue
            e["author_position"] = pos
            e["n_authors"] = len(e["authors"])
            tagged.append(e)
        chosen, rej_log, source_tag = select_lead_papers(tagged, k=3)
        rec["extra"] = {
            "n_tagged_as_author": len(tagged),
            "n_chosen": len(chosen),
            "source_tag": source_tag,
        }
    print(f"  {len(tagged)} of {len(entries)} have {full_name} as author (NFKD-normalised match)", flush=True)
    print(f"  ongoing: selected {len(chosen)} papers (source: {source_tag})", flush=True)

    consortium = [e for e in entries if len(e["authors"]) >= 50]
    if consortium:
        print(f"  NOTE: {len(consortium)} candidate(s) had >=50 authors (consortium).", flush=True)

    # ---------- STAGE 3+4: HTML-first fetch, PDF fallback ----------
    papers_meta = []
    for i, e in enumerate(chosen, 1):
        print(
            f"    [{i}] tier-{e['tier']} pos {e['author_position']}/{e['n_authors']}  "
            f"{e['published'][:10]}  {e['title'][:80]}",
            flush=True,
        )
        last_ts = sleep_rate_limit(last_ts, 5.0)
        fetch_method = None
        html_bytes_len = 0
        pdf_bytes_len = 0
        extracted = None

        # --- STAGE 3: HTML fetch (Patch 5 primary path) ---
        with stage("3_html_fetch", pid, extra={
            "paper_index": i, "arxiv_id": e["arxiv_id"], "published": e["published"][:10],
        }) as rec:
            html_bytes, status, url_tried = fetch_html(e["arxiv_id"])
            rec["extra"]["html_status"] = status
            rec["extra"]["url_tried"] = url_tried
            if html_bytes is not None:
                html_bytes_len = len(html_bytes)
                rec["extra"]["payload_bytes"] = html_bytes_len
                (out_dir / "papers" / f"paper_{i}.html").write_bytes(html_bytes)
        if html_bytes is not None:
            fetch_method = "html_native"
            print(f"        HTML-first OK ({html_bytes_len/1024:.0f} KB)", flush=True)

        # --- STAGE 4: PDF fallback + pdftotext (only when HTML missing) ---
        if fetch_method is None:
            last_ts = sleep_rate_limit(last_ts, 5.0)
            with stage("4_pdf_pdftotext", pid, extra={
                "paper_index": i, "arxiv_id": e["arxiv_id"], "published": e["published"][:10],
            }) as rec:
                dest_pdf = out_dir / "papers" / f"paper_{i}.pdf"
                try:
                    pdf_bytes_len = download_pdf(e["pdf_url"], dest_pdf)
                    rec["extra"]["payload_bytes"] = pdf_bytes_len
                    rec["extra"]["pdf_download_ok"] = True
                except Exception as ex:
                    print(f"        FAILED PDF: {ex}", flush=True)
                    rec["extra"]["pdf_download_ok"] = False
                    continue
                # pdftotext inside same stage timer
                t0_pdftotext = time.time()
                text_dump = pdf_to_text(dest_pdf)
                rec["extra"]["pdftotext_ms"] = int((time.time() - t0_pdftotext) * 1000)
                rec["extra"]["pdftotext_chars"] = len(text_dump)
            fetch_method = "pdf_pdftotext"
            print(f"        PDF fallback OK ({pdf_bytes_len/1024:.0f} KB)", flush=True)

        # --- STAGE 5: section extraction ---
        with stage("5_section_extract", pid, extra={
            "paper_index": i, "arxiv_id": e["arxiv_id"], "fetch_method": fetch_method,
        }) as rec:
            if fetch_method == "html_native":
                parts = parse_html_sections(html_bytes)
            else:
                parts = pdf_extract(text_dump)
            assembled = assemble_payload(parts)
            rec["extra"]["has_abstract"] = assembled["has_abstract"]
            rec["extra"]["has_intro"] = assembled["has_intro"]
            rec["extra"]["has_conclusion"] = assembled["has_conclusion"]
            rec["extra"]["payload_chars"] = assembled["payload_chars"]
        extracted_path = out_dir / "papers" / f"paper_{i}_extracted.json"
        extracted_path.write_text(json.dumps({
            "paper_index": i,
            "arxiv_id": e["arxiv_id"],
            "title": e["title"],
            "fetch_method": fetch_method,
            "extraction": {
                "has_abstract": assembled["has_abstract"],
                "has_intro": assembled["has_intro"],
                "has_conclusion": assembled["has_conclusion"],
                "payload_chars": assembled["payload_chars"],
                "total_source_chars": (html_bytes_len if fetch_method == "html_native"
                                        else (len(text_dump) if fetch_method == "pdf_pdftotext" else 0)),
            },
            "payload": assembled["payload"],
        }, indent=2))

        papers_meta.append({
            "paper_index": i, "arxiv_id": e["arxiv_id"], "title": e["title"],
            "published": e["published"], "pdf_url": e["pdf_url"],
            "abstract": e["summary"], "author_position": e["author_position"],
            "n_authors": e["n_authors"], "categories": e.get("categories", []),
            "tier": e["tier"], "fetch_method": fetch_method,
            "html_payload_bytes": html_bytes_len,
            "pdf_payload_bytes": pdf_bytes_len,
            "author_list": [a[0] for a in e["authors"]],
        })

    ingest = {
        "person": full_name, "pid": pid, "section": section,
        "section_categories": categories,
        "filter_used": filter_used, "manual_review": manual_review,
        "arxiv_query_author_only": author_query,
        "arxiv_query_filtered": filtered_query,
        "candidates_total": len(entries), "candidates_with_author": len(tagged),
        "source_tag": source_tag, "consortium_count_50plus": len(consortium),
        "selection_log": rej_log, "papers": papers_meta,
    }
    (out_dir / "ingest_log.json").write_text(json.dumps(ingest, indent=2))

    all_author_lists = []
    for b in background:
        all_author_lists.append({
            "arxiv_id": b["arxiv_id"], "source": "background",
            "authors": [a[0] for a in b["authors"]],
        })
    for p in chosen:
        all_author_lists.append({
            "arxiv_id": p["arxiv_id"], "source": "ongoing",
            "authors": [a[0] for a in p["authors"]],
        })
    (out_dir / "authors.json").write_text(json.dumps(
        {"person": full_name, "pid": pid, "papers": all_author_lists}, indent=2
    ))
    return last_ts


def main() -> None:
    picks = json.loads((BASE / "picks.json").read_text())["picks"]
    last_ts = 0.0
    for p in picks:
        last_ts = process_person(p, last_ts)
    print(f"\nDone. Corpus at {CORPUS}")


if __name__ == "__main__":
    main()
