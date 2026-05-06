"""Pure fallback (PATCH 4) — pilot v4.

Unchanged algorithmically from pilot-v3 01b_pure_fallback.py except for
  (a) reading picks.json from pilot-v5/, and
  (b) emitting a `4_pdf_pdftotext`-style timing event as 'pure_fetch' if needed
      (merged into step-4 timing bucket is fine; we record separately).
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
import time
from datetime import datetime, timezone

import requests

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _timing import stage  # noqa: E402

ARTIFACTS = pathlib.Path(
    "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts"
)
CORPUS = ARTIFACTS / "corpus"
BASE = ARTIFACTS / "phase_a"
FAC_JSON = ARTIFACTS / "nbi_faculty.json"

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
}
RATE_LIMIT_S = 1.1
CURRENT_YEAR = datetime.now(timezone.utc).year
RECENCY_YEARS = 3


def sleep_rate_limit(last_ts):
    now = time.time()
    dt = now - last_ts
    if dt < RATE_LIMIT_S:
        time.sleep(RATE_LIMIT_S - dt)
    return time.time()


def fetch(url, last_ts):
    last_ts = sleep_rate_limit(last_ts)
    r = requests.get(url, headers=HEADERS, timeout=45)
    r.raise_for_status()
    return r.text, time.time()


_PUB_HREF_RE = re.compile(
    r'href="(https://researchprofiles\.ku\.dk/en/publications/[a-z0-9][a-z0-9-]*/)"'
)
_ABSTRACT_RE = re.compile(
    r'rendering_abstractportal[^"]*"[^>]*>\s*<div class="textblock">(.*?)</div>\s*</div>', re.S,
)
_TITLE_RE = re.compile(r'<title>\s*(.*?)\s*-\s*University of Copenhagen', re.S)
_AUTHORS_RE = re.compile(r'class="link person"><span>([^<]+)</span>')
_DATE_SPAN_RE = re.compile(r'<span class="date">([^<]+)</span>')
_YEAR_RE = re.compile(r'\b(19|20)\d{2}\b')


def parse_publication_list(h):
    urls, seen = [], set()
    for m in _PUB_HREF_RE.finditer(h):
        u = m.group(1)
        if u in seen: continue
        seen.add(u); urls.append(u)
    return urls


def parse_year(h):
    m = _DATE_SPAN_RE.search(h)
    if m:
        ym = _YEAR_RE.search(m.group(1))
        if ym: return int(ym.group(0))
    for pat in [r'citation_publication_date[^>]*content="(\d{4})',
                r'citation_online_date[^>]*content="(\d{4})',
                r'citation_date[^>]*content="(\d{4})']:
        m = re.search(pat, h)
        if m: return int(m.group(1))
    return None


def parse_abstract(h):
    m = _ABSTRACT_RE.search(h)
    if not m: return None
    raw = m.group(1)
    txt = re.sub(r"<[^>]+>", " ", raw)
    txt = re.sub(r"\s+", " ", txt).strip()
    return (txt.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<")
              .replace("&gt;", ">").replace("&#39;", "'").replace("&quot;", '"')) or None


def parse_title(h):
    m = _TITLE_RE.search(h)
    if m:
        t = re.sub(r"\s+", " ", m.group(1)).strip()
        return t or None
    return None


def parse_authors(h):
    out, seen = [], set()
    for m in _AUTHORS_RE.finditer(h):
        n = m.group(1).strip()
        if n and n not in seen:
            seen.add(n); out.append(n)
    return out


def process_person(person, last_ts):
    pid = person["id"]
    name = person["name"]
    section = person["section"]
    pure_page = person.get("pure_page")
    d = CORPUS / pid
    ingest_path = d / "ingest_log.json"

    need_fallback = False
    reason = ""
    if not ingest_path.exists():
        need_fallback = True
        reason = "no ingest_log"
    else:
        ing = json.loads(ingest_path.read_text())
        if ing.get("pure_fallback"):
            print(f"{pid} {name}: already pure_fallback, cache_hit", flush=True)
            return last_ts
        n_bg = ing.get("candidates_total", 0)
        n_papers = len(ing.get("papers", []))
        if n_bg == 0 or n_papers < 3:
            need_fallback = True
            reason = f"only {n_bg} bg / {n_papers} lead-author papers from arXiv"
    if not need_fallback:
        return last_ts

    print(f"\n=== Pure fallback: {name} ({pid}) · {section} ===", flush=True)
    print(f"    reason: {reason}", flush=True)
    if not pure_page:
        print("    no pure_page URL"); return last_ts

    d.mkdir(parents=True, exist_ok=True)
    (d / "background_candidates").mkdir(exist_ok=True)
    (d / "papers").mkdir(exist_ok=True)

    with stage("pure_fallback_full", pid, extra={"reason": reason}) as sta:
        try:
            person_html, last_ts = fetch(pure_page, last_ts)
        except Exception as ex:
            print(f"    FAILED: {ex}"); return last_ts
        pub_urls = parse_publication_list(person_html)
        print(f"    {len(pub_urls)} publication slugs", flush=True)
        fetched = []
        for url in pub_urls[:25]:
            try:
                phtml, last_ts = fetch(url, last_ts)
            except Exception as ex:
                print(f"    FAILED {url}: {ex}"); continue
            fetched.append({
                "url": url, "title": parse_title(phtml), "year": parse_year(phtml),
                "authors": parse_authors(phtml), "abstract": parse_abstract(phtml),
                "has_abstract": bool(parse_abstract(phtml)),
            })
            if sum(1 for f in fetched if f["has_abstract"]) >= 10: break
        recent = [f for f in fetched if f["has_abstract"] and f["year"] and f["year"] >= CURRENT_YEAR - RECENCY_YEARS]
        all_abs = [f for f in fetched if f["has_abstract"]]
        if recent:
            chosen_bg_pool, tier = recent, "pure_recent_3y_with_abstract"
        elif all_abs:
            chosen_bg_pool, tier = all_abs, "pure_any_year_with_abstract"
        else:
            chosen_bg_pool, tier = fetched, "pure_title_only"
        chosen_bg_pool = sorted(chosen_bg_pool, key=lambda f: f["year"] or 0, reverse=True)
        bg_chosen = chosen_bg_pool[:10]
        bg_meta = []
        for i, f in enumerate(bg_chosen, 1):
            abstract_text = f["abstract"] or (f["title"] or "")
            bg_meta.append({
                "idx": i, "arxiv_id": f"pure:{pid}:{i}", "pure_url": f["url"],
                "title": f["title"], "published": f"{f['year']}-01-01" if f["year"] else "",
                "author_position": None, "n_authors": len(f["authors"]),
                "categories": [], "abstract": abstract_text,
                "abstract_is_real": f["has_abstract"], "authors": f["authors"],
            })
            (d / "background_candidates" / f"abstract_{i}.json").write_text(json.dumps(bg_meta[-1], indent=2))
        (d / "background_candidates" / "index.json").write_text(json.dumps({
            "person": name, "pid": pid, "source": "pure_fallback_real_abstracts",
            "selection_tier": tier, "n_publications_on_person_page": len(pub_urls),
            "n_publications_fetched": len(fetched),
            "n_with_real_abstract": sum(1 for f in fetched if f["has_abstract"]),
            "n_background_selected": len(bg_meta),
            "abstracts": bg_meta,
        }, indent=2))
        ongoing_papers = bg_meta[:3]
        ongoing_meta = []
        for i, bm in enumerate(ongoing_papers, 1):
            ongoing_meta.append({
                "paper_index": i, "arxiv_id": bm["arxiv_id"], "pure_url": bm["pure_url"],
                "title": bm["title"], "published": bm["published"], "pdf_url": None,
                "abstract": bm["abstract"], "author_position": None,
                "n_authors": bm["n_authors"], "categories": [], "tier": "pure_abstract",
                "author_list": bm["authors"], "fetch_method": "pure_abstract",
            })
        (d / "ingest_log.json").write_text(json.dumps({
            "person": name, "pid": pid, "section": section,
            "arxiv_query_author_only": person["arxiv_query"],
            "arxiv_query_filtered": None, "filter_used": "pure_fallback",
            "manual_review": True, "source_tag": "pure_abstract", "selection_tier": tier,
            "candidates_total": len(bg_meta), "candidates_with_author": len(bg_meta),
            "consortium_count_50plus": 0, "selection_log": [],
            "papers": ongoing_meta, "pure_fallback": True,
            "pure_shallow_ongoing_note": "ongoing_text built from ABSTRACTS (no PDFs)",
        }, indent=2))
        all_author_lists = []
        for f in bg_chosen:
            all_author_lists.append({
                "arxiv_id": f"pure:{pid}:{bg_chosen.index(f)+1}",
                "source": "background", "authors": f["authors"],
            })
        for om in ongoing_meta:
            all_author_lists.append({
                "arxiv_id": om["arxiv_id"], "source": "ongoing", "authors": om["author_list"],
            })
        (d / "authors.json").write_text(json.dumps({
            "person": name, "pid": pid, "papers": all_author_lists, "pure_fallback": True,
        }, indent=2))
        for om in ongoing_meta:
            i = om["paper_index"]
            (d / "papers" / f"paper_{i}_extracted.json").write_text(json.dumps({
                "paper_index": i, "arxiv_id": om["arxiv_id"], "title": om["title"],
                "fetch_method": "pure_abstract",
                "extraction": {
                    "has_abstract": True, "has_intro": False, "has_conclusion": False,
                    "payload_chars": len(om["abstract"] or ""), "total_source_chars": 0,
                },
                "payload": (f"\n=== ABSTRACT ===\n{om['abstract']}" if om["abstract"]
                            else f"\n=== TITLE ===\n{om['title']}"),
            }, indent=2))
        sta["extra"]["n_bg"] = len(bg_meta)
        sta["extra"]["n_ongoing"] = len(ongoing_meta)
        sta["extra"]["tier"] = tier
    print(f"    -> {len(bg_meta)} bg, {len(ongoing_meta)} ongoing; tier={tier}")
    return last_ts


def main():
    picks = json.loads((BASE / "picks.json").read_text())["picks"]
    facs = {f["id"]: f for f in json.loads(FAC_JSON.read_text())["faculty"]}
    last_ts = 0.0
    for p in picks:
        if p["id"] not in facs:
            print(f"SKIP {p['id']}"); continue
        last_ts = process_person(p, last_ts)


if __name__ == "__main__":
    main()
