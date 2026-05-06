"""PATCH 8 - multi-source abstract chain + SHALLOW-CACHE-UPGRADE rule.

For every faculty in picks.json, walk their ingest_log.json and per-paper
extractions. Any paper flagged as title_only (either by `abstract_source ==
'title_only'`, or by the v4-legacy marker `selection_tier == 'pure_title_only'`
where `abstract == title`) is retried against:

    1. Pure page itself  (already tried in 01b; here we just look at cache)
    2. INSPIRE-HEP  (api.inspirehep.net)
    3. OpenAlex     (api.openalex.org)
    4. Crossref     (api.crossref.org)

Stops at the first tier that returns a non-empty abstract. Records
`abstract_source` per paper in ingest_log.json AND updates the per-paper
`paper_{i}_extracted.json` with the real abstract so steps 3-5 downstream
re-synthesise on grounded text rather than titles.

If ANY paper is upgraded for a person, the shallow-cache-upgrade rule fires:

  - summaries/paper_{i}.json are deleted for upgraded papers (step-4 redoes)
  - ongoing_extracts.json is deleted (step-4 aggregation redoes)
  - ongoing_text.json is deleted (step-5 synthesis redoes)
  - embedding.json is deleted (ongoing text changed, w_vec invalid)

Background_text.json is NOT deleted: the background stage uses the full set of
abstracts and its input is the same 10 abstracts - if those are titles-only the
background synthesis already used titles. For a proper rerun we also delete
background_text.json, bg cache index and the bg candidate files so the
background pass also regenerates from real abstracts.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
import time
import urllib.parse
from datetime import datetime, timezone

import requests

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _timing import stage  # noqa: E402

ARTIFACTS = pathlib.Path(
    "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts"
)
CORPUS = ARTIFACTS / "corpus"
BASE = ARTIFACTS / "phase_a"

UA = "NBI-pilot-pipeline/0.5 (contact danieltmurnane@gmail.com)"

INSPIRE_URL = "https://inspirehep.net/api/literature"
OPENALEX_URL = "https://api.openalex.org/works"
CROSSREF_URL = "https://api.crossref.org/works"


def _get_json(url: str, params: dict | None = None, timeout: int = 30) -> dict | None:
    try:
        r = requests.get(url, params=params, headers={"User-Agent": UA}, timeout=timeout)
        if r.status_code != 200:
            return None
        return r.json()
    except (requests.exceptions.RequestException, ValueError):
        return None


def extract_arxiv_id_from_pure_url(url: str | None) -> str | None:
    """Pure pages can include arxiv_id metadata, but we don't re-fetch here."""
    return None


def try_inspire(title: str | None, arxiv_id: str | None, doi: str | None) -> str | None:
    parts = []
    if arxiv_id:
        parts.append(f'arxiv:{arxiv_id}')
    if doi:
        parts.append(f'doi:"{doi}"')
    if title:
        clean = title.replace('"', "").replace("\\", "")
        parts.append(f'title "{clean[:200]}"')
    if not parts:
        return None
    q = " OR ".join(parts)
    j = _get_json(INSPIRE_URL, params={"q": q, "fields": "titles,abstracts,arxiv_eprints,dois", "size": 1})
    if not j:
        return None
    hits = j.get("hits", {}).get("hits", [])
    if not hits:
        return None
    md = hits[0].get("metadata", {}) or {}
    for a in md.get("abstracts", []) or []:
        v = (a or {}).get("value") or ""
        if v and len(v) > 80:
            return v.strip()
    return None


def try_openalex(arxiv_id: str | None, doi: str | None, title: str | None) -> str | None:
    j = None
    if doi:
        j = _get_json(f"{OPENALEX_URL}/doi:{doi}")
    if not j and arxiv_id:
        j = _get_json(f"{OPENALEX_URL}/arxiv:{arxiv_id}")
    if not j and title:
        jj = _get_json(f"{OPENALEX_URL}", params={
            "search": title, "per-page": 1,
            "select": "id,title,abstract_inverted_index",
        })
        if jj and jj.get("results"):
            j = jj["results"][0]
    if not j:
        return None
    inv = j.get("abstract_inverted_index")
    if not inv:
        return None
    # reconstruct: for each word, each occurrence is a position
    positions = []
    for word, poslist in inv.items():
        for p in poslist:
            positions.append((p, word))
    positions.sort(key=lambda x: x[0])
    txt = " ".join(w for _, w in positions).strip()
    return txt if len(txt) > 80 else None


def try_crossref(doi: str | None, title: str | None) -> str | None:
    j = None
    if doi:
        j = _get_json(f"{CROSSREF_URL}/{doi}")
    if not j and title:
        jj = _get_json(CROSSREF_URL, params={"query.title": title, "rows": 1})
        if jj and jj.get("message", {}).get("items"):
            j = {"message": jj["message"]["items"][0]}
    if not j:
        return None
    m = j.get("message", {})
    abstract = m.get("abstract")
    if not abstract:
        return None
    clean = re.sub(r"<[^>]+>", " ", abstract)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean if len(clean) > 80 else None


def try_inspire_by_pure_title(title: str) -> tuple[str | None, str | None, str | None]:
    """Query INSPIRE-HEP by title alone; return (abstract, arxiv_id, doi)."""
    if not title:
        return None, None, None
    clean = title.replace('"', "").replace("\\", "")[:200]
    j = _get_json(INSPIRE_URL, params={
        "q": f'title "{clean}"',
        "fields": "titles,abstracts,arxiv_eprints,dois",
        "size": 1,
    })
    if not j:
        return None, None, None
    hits = j.get("hits", {}).get("hits", [])
    if not hits:
        return None, None, None
    md = hits[0].get("metadata", {}) or {}
    abstract = None
    for a in md.get("abstracts", []) or []:
        v = (a or {}).get("value") or ""
        if v and len(v) > 80:
            abstract = v.strip()
            break
    arxiv_id = None
    for e in md.get("arxiv_eprints", []) or []:
        v = (e or {}).get("value")
        if v:
            arxiv_id = v
            break
    doi = None
    for d_ in md.get("dois", []) or []:
        v = (d_ or {}).get("value")
        if v:
            doi = v
            break
    return abstract, arxiv_id, doi


def is_title_only(paper_record: dict) -> bool:
    """Decide whether this paper's abstract is really just the title (v4 legacy
    pure_title_only) or marked title_only."""
    src = paper_record.get("abstract_source")
    if src == "title_only":
        return True
    abstract = (paper_record.get("abstract") or "").strip()
    title = (paper_record.get("title") or "").strip()
    if not abstract or abstract == title:
        return True
    # ratio check: if abstract is just the title + a few chars, treat as title_only
    if len(abstract) < 200 and title and abstract.startswith(title[: min(80, len(title))]):
        return True
    return False


def upgrade_one_person(pid: str, name: str) -> dict:
    d = CORPUS / pid
    ingest_path = d / "ingest_log.json"
    if not ingest_path.exists():
        return {"pid": pid, "skipped": True, "reason": "no ingest_log"}
    ingest = json.loads(ingest_path.read_text())
    papers = ingest.get("papers", [])
    if not papers:
        return {"pid": pid, "skipped": True, "reason": "no papers"}

    upgraded_indices: list[int] = []
    sources_before = {}
    sources_after = {}
    attempts_log = []
    for pm in papers:
        i = pm["paper_index"]
        title_only_before = is_title_only(pm)
        before_src = pm.get("abstract_source") or ("title_only" if title_only_before else "pure_page_or_arxiv")
        sources_before[i] = before_src

        if not title_only_before:
            sources_after[i] = before_src
            continue

        print(f"  {pid} paper_{i}: title_only detected, trying Patch 8 chain", flush=True)

        title = pm.get("title") or ""
        arxiv_id = pm.get("arxiv_id")
        if arxiv_id and arxiv_id.startswith("pure:"):
            arxiv_id = None  # sentinel pure id, not a real arxiv id
        doi = pm.get("doi")
        pure_url = pm.get("pure_url") or pm.get("pdf_url")

        attempt = {"paper_index": i, "title": title[:140], "chain": []}

        # Try INSPIRE-HEP first (also returns arxiv_id+doi we can use for subsequent fallbacks)
        abstract = None
        used_source = None
        insp_abs, insp_arxiv, insp_doi = try_inspire_by_pure_title(title)
        attempt["chain"].append({"source": "inspire_hep", "ok": bool(insp_abs), "len": len(insp_abs or "")})
        if insp_abs:
            abstract = insp_abs
            used_source = "inspire_hep"
            if insp_arxiv and not arxiv_id: arxiv_id = insp_arxiv
            if insp_doi and not doi: doi = insp_doi

        # OpenAlex
        if not abstract:
            oa = try_openalex(arxiv_id, doi, title)
            attempt["chain"].append({"source": "openalex", "ok": bool(oa), "len": len(oa or "")})
            if oa:
                abstract = oa
                used_source = "openalex"

        # Crossref
        if not abstract:
            cr = try_crossref(doi, title)
            attempt["chain"].append({"source": "crossref", "ok": bool(cr), "len": len(cr or "")})
            if cr:
                abstract = cr
                used_source = "crossref"

        if abstract:
            pm["abstract"] = abstract
            pm["abstract_source"] = used_source
            if arxiv_id: pm["arxiv_id_resolved"] = arxiv_id
            if doi: pm["doi_resolved"] = doi
            sources_after[i] = used_source
            upgraded_indices.append(i)
            # Update papers/paper_i_extracted.json payload so step 4 sees the real abstract
            ex_path = d / "papers" / f"paper_{i}_extracted.json"
            if ex_path.exists():
                ex = json.loads(ex_path.read_text())
            else:
                ex = {"paper_index": i, "arxiv_id": pm.get("arxiv_id"), "title": title,
                      "fetch_method": "pure_abstract", "extraction": {}, "payload": ""}
            ex["payload"] = f"\n=== ABSTRACT ===\n{abstract}"
            ex["extraction"] = {
                "has_abstract": True, "has_intro": False, "has_conclusion": False,
                "payload_chars": len(ex["payload"]), "total_source_chars": len(abstract),
                "abstract_source": used_source,
            }
            ex["title"] = title
            ex_path.write_text(json.dumps(ex, indent=2))
            print(f"    -> {used_source} ({len(abstract)} chars)", flush=True)
        else:
            pm["abstract_source"] = "title_only"
            sources_after[i] = "title_only"
            print(f"    -> all tiers missed; staying title_only", flush=True)

        attempts_log.append(attempt)

    ingest["papers"] = papers
    ingest["patch8_applied"] = True
    ingest["patch8_timestamp"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    ingest["patch8_sources_before"] = sources_before
    ingest["patch8_sources_after"] = sources_after
    ingest["patch8_upgraded_indices"] = upgraded_indices
    ingest["patch8_attempts"] = attempts_log

    # Shallow-cache-upgrade cleanup
    shallow_cache_upgrade_deletions = []
    if upgraded_indices:
        # Delete downstream caches so steps 3-5 rerun on grounded abstracts.
        for candidate in [
            d / "ongoing_extracts.json",
            d / "ongoing_text.json",
            d / "embedding.json",
            d / "background_text.json",  # re-synth with grounded abstracts
        ]:
            if candidate.exists():
                candidate.unlink()
                shallow_cache_upgrade_deletions.append(candidate.name)
        for i in upgraded_indices:
            sf = d / "summaries" / f"paper_{i}.json"
            if sf.exists():
                sf.unlink()
                shallow_cache_upgrade_deletions.append(f"summaries/paper_{i}.json")
        # Also refresh bg_candidates so step 2 synth sees real abstracts.
        # For each bg candidate file we now replace .abstract with real abstract
        # if that same paper appears in upgraded set. (Safe: bg uses same source.)
        bg_index_path = d / "background_candidates" / "index.json"
        if bg_index_path.exists():
            bgj = json.loads(bg_index_path.read_text())
            paper_by_title = {pm["title"]: pm for pm in papers if pm.get("abstract_source") not in (None, "title_only")}
            any_bg_upgrade = False
            for bg_rec in bgj.get("abstracts", []):
                real = paper_by_title.get(bg_rec.get("title"))
                if real and real.get("abstract"):
                    if bg_rec.get("abstract") != real["abstract"]:
                        bg_rec["abstract"] = real["abstract"]
                        bg_rec["abstract_is_real"] = True
                        bg_rec["abstract_source"] = real["abstract_source"]
                        any_bg_upgrade = True
            if any_bg_upgrade:
                bgj["patch8_applied"] = True
                bg_index_path.write_text(json.dumps(bgj, indent=2))
                shallow_cache_upgrade_deletions.append("bg_index:in-place-abstract-refresh")

    ingest["patch8_downstream_deletions"] = shallow_cache_upgrade_deletions
    ingest_path.write_text(json.dumps(ingest, indent=2))

    return {
        "pid": pid,
        "name": name,
        "n_papers": len(papers),
        "n_title_only_before": sum(1 for v in sources_before.values() if v == "title_only"),
        "n_upgraded": len(upgraded_indices),
        "sources_before": sources_before,
        "sources_after": sources_after,
        "downstream_deletions": shallow_cache_upgrade_deletions,
    }


def main() -> None:
    picks = json.loads((BASE / "picks.json").read_text())["picks"]
    print(f"Patch 8 / shallow-cache-upgrade across {len(picks)} faculty\n")
    rollup = []
    for p in picks:
        pid = p["id"]
        name = p["name"]
        with stage("patch8_chain", pid) as rec:
            result = upgrade_one_person(pid, name)
            rec["extra"] = result
        print(
            f"{pid} {name}: papers={result.get('n_papers', 0)} "
            f"title_only_before={result.get('n_title_only_before', 0)} "
            f"upgraded={result.get('n_upgraded', 0)}"
        )
        if result.get("downstream_deletions"):
            print(f"  deleted: {result['downstream_deletions']}")
        rollup.append(result)
    (BASE / "patch8_report.json").write_text(json.dumps(rollup, indent=2))
    print(f"\nWrote {BASE / 'patch8_report.json'}")


if __name__ == "__main__":
    main()
