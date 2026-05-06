"""Patch 9 — strict collaboration filter.

For every faculty's ingest_log.json, iterate papers. For any paper where the
abstract was sourced via Patch 8 chain (inspire_hep / openalex / crossref) or
via Pure fallback (pure_abstract), re-fetch the source with authors included
and apply the rule:

    reject if n_authors > 20 AND target_position not in [1, 5] ∪ [n-4, n]

On reject: flip abstract_source to "title_only", set collaboration_filtered:
true, set abstract to the title. Overwrite papers/paper_i_extracted.json with
title-only payload. Invalidate downstream caches (ongoing_text, embedding,
summaries/paper_i.json). Set node_meta.json manual_review: true if >= 2
papers flip.

Arxiv-tier papers use cached n_authors + author_position from the tier filter
(Patch 1) — no re-fetch needed. They rarely trigger Patch 9 because Tier A/B
already enforce first/last 5.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone

import requests

ARTIFACTS = pathlib.Path(
    "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts"
)
CORPUS = ARTIFACTS / "corpus"
BASE = ARTIFACTS / "phase_a"
UA = "NBI-phase-a-pipeline/0.1 (contact danieltmurnane@gmail.com)"

INSPIRE_URL = "https://inspirehep.net/api/literature"
OPENALEX_URL = "https://api.openalex.org/works"
CROSSREF_URL = "https://api.crossref.org/works"


def nfkd(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def _get_json(url, params=None, timeout=30):
    try:
        r = requests.get(url, params=params, headers={"User-Agent": UA}, timeout=timeout)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


def find_target_position(authors_list, target_name):
    """1-indexed position of target within authors list; match on normalised surname
    + first-initial. Returns None if not found."""
    target_norm = nfkd(target_name)
    tks = target_norm.split()
    if not tks:
        return None
    surname = tks[-1]
    first_initial = tks[0][0] if tks[0] else ""
    for i, author in enumerate(authors_list, 1):
        a_norm = nfkd(author)
        # handle "Last, First" and "First Last" and "Last, F"
        a_norm = a_norm.replace(",", " ")
        a_tks = a_norm.split()
        if not a_tks:
            continue
        # If author seems to be "Last F" or "F Last", match against any token being surname
        if surname in a_tks:
            # check first initial if possible
            other_tokens = [t for t in a_tks if t != surname]
            if not first_initial or not other_tokens:
                return i
            if any(t[0] == first_initial for t in other_tokens):
                return i
    return None


def patch9_check(authors_list, target_name):
    n = len(authors_list)
    pos = find_target_position(authors_list, target_name)
    if pos is None:
        return {"accept": True, "n_authors": n, "target_position": None, "reason": "target_not_matched"}
    if n <= 20:
        return {"accept": True, "n_authors": n, "target_position": pos, "reason": "small_team"}
    if pos <= 5 or pos >= n - 4:
        return {"accept": True, "n_authors": n, "target_position": pos, "reason": "lead_in_large_team"}
    return {"accept": False, "n_authors": n, "target_position": pos, "reason": "collaboration_filtered"}


def fetch_inspire(title=None, arxiv_id=None, doi=None):
    parts = []
    if arxiv_id:
        parts.append(f'arxiv:{arxiv_id}')
    if doi:
        parts.append(f'doi:"{doi}"')
    if title:
        clean = (title or "").replace('"', "").replace("\\", "")
        parts.append(f'title "{clean[:200]}"')
    if not parts:
        return None, []
    j = _get_json(INSPIRE_URL, params={
        "q": " OR ".join(parts),
        "fields": "titles,abstracts,authors,arxiv_eprints,dois",
        "size": 1,
    })
    if not j:
        return None, []
    hits = j.get("hits", {}).get("hits", [])
    if not hits:
        return None, []
    md = hits[0].get("metadata", {}) or {}
    abstract = None
    for a in md.get("abstracts", []) or []:
        v = (a or {}).get("value") or ""
        if v and len(v) > 80:
            abstract = v.strip()
            break
    authors = [(a.get("full_name") or "") for a in (md.get("authors") or [])]
    return abstract, authors


def fetch_openalex(arxiv_id=None, doi=None, title=None):
    j = None
    if doi:
        j = _get_json(f"{OPENALEX_URL}/doi:{doi}")
    if not j and arxiv_id:
        j = _get_json(f"{OPENALEX_URL}/arxiv:{arxiv_id}")
    if not j and title:
        jj = _get_json(OPENALEX_URL, params={
            "search": title, "per-page": 1,
            "select": "id,title,abstract_inverted_index,authorships",
        })
        if jj and jj.get("results"):
            j = jj["results"][0]
    if not j:
        return None, []
    inv = j.get("abstract_inverted_index")
    abstract = None
    if inv:
        positions = []
        for word, poslist in inv.items():
            for p in poslist:
                positions.append((p, word))
        positions.sort(key=lambda x: x[0])
        txt = " ".join(w for _, w in positions).strip()
        if len(txt) > 80:
            abstract = txt
    authors = [(a.get("author", {}).get("display_name") or "") for a in (j.get("authorships") or [])]
    return abstract, authors


def fetch_crossref(doi=None, title=None):
    j = None
    if doi:
        j = _get_json(f"{CROSSREF_URL}/{doi}")
    if not j and title:
        jj = _get_json(CROSSREF_URL, params={"query.title": title, "rows": 1})
        if jj and jj.get("message", {}).get("items"):
            j = {"message": jj["message"]["items"][0]}
    if not j:
        return None, []
    m = j.get("message", {})
    abstract = m.get("abstract")
    if abstract:
        abstract = re.sub(r"<[^>]+>", " ", abstract)
        abstract = re.sub(r"\s+", " ", abstract).strip()
        if len(abstract) <= 80:
            abstract = None
    authors = [
        (f"{a.get('given','')} {a.get('family','')}".strip())
        for a in (m.get("author") or [])
    ]
    return abstract, authors


def flip_to_title_only(pm, d, check, source):
    pm["abstract_source"] = "title_only"
    pm["collaboration_filtered"] = True
    pm["patch9_rejected_source"] = source
    pm["patch9_rejection_reason"] = check["reason"]
    pm["n_authors_patch9"] = check["n_authors"]
    pm["target_position_patch9"] = check["target_position"]
    title = pm.get("title") or ""
    pm["abstract"] = title

    ex_path = d / "papers" / f"paper_{pm['paper_index']}_extracted.json"
    try:
        if ex_path.exists():
            ex = json.loads(ex_path.read_text())
        else:
            ex = {"paper_index": pm["paper_index"], "title": title, "extraction": {}, "payload": ""}
        ex["payload"] = f"\n=== TITLE ONLY (Patch 9 rejected {source}; n_authors={check['n_authors']}, pos={check['target_position']}) ===\n{title}"
        ex["extraction"] = {
            "has_abstract": False,
            "abstract_source": "title_only",
            "collaboration_filtered": True,
            "n_authors": check["n_authors"],
            "target_position": check["target_position"],
            "rejected_source": source,
        }
        ex["title"] = title
        ex_path.parent.mkdir(parents=True, exist_ok=True)
        ex_path.write_text(json.dumps(ex, indent=2))
    except Exception as e:
        print(f"    warning: couldn't update extracted.json: {e}", flush=True)


def invalidate_downstream(d, filtered_indices):
    deleted = []
    if not filtered_indices:
        return deleted
    for cand in [
        d / "ongoing_extracts.json",
        d / "ongoing_text.json",
        d / "embedding.json",
        d / "background_text.json",
    ]:
        if cand.exists():
            cand.unlink()
            deleted.append(cand.name)
    for i in filtered_indices:
        sf = d / "summaries" / f"paper_{i}.json"
        if sf.exists():
            sf.unlink()
            deleted.append(f"summaries/paper_{i}.json")
    return deleted


def process_person(pid, name):
    d = CORPUS / pid
    ingest_path = d / "ingest_log.json"
    if not ingest_path.exists():
        return {"pid": pid, "skipped": "no_ingest_log"}
    ingest = json.loads(ingest_path.read_text())
    papers = ingest.get("papers", [])
    if not papers:
        return {"pid": pid, "skipped": "no_papers"}

    n_checked = 0
    filtered_indices = []

    for pm in papers:
        src = pm.get("abstract_source")

        # Source-dependent treatment
        if src in ("inspire_hep", "openalex", "crossref", "pure_abstract"):
            # Need to re-fetch with authors (for the Patch 8 chain sources the original
            # fetch didn't retain authors; for pure_abstract the cached n_authors can
            # be wrong — it counts only NBI co-authors).
            n_checked += 1
            title = pm.get("title") or ""
            arxiv_id = pm.get("arxiv_id_resolved") or pm.get("arxiv_id")
            if arxiv_id and str(arxiv_id).startswith("pure:"):
                arxiv_id = None
            doi = pm.get("doi_resolved") or pm.get("doi")

            # Try INSPIRE-HEP first with full author list regardless of original source,
            # because INSPIRE has the most thorough author lists for HEP.
            abstract, authors = fetch_inspire(title=title, arxiv_id=arxiv_id, doi=doi)
            time.sleep(1.0)
            chain_used = "inspire_hep"

            if not authors:
                abstract, authors = fetch_openalex(arxiv_id=arxiv_id, doi=doi, title=title)
                time.sleep(1.0)
                chain_used = "openalex"

            if not authors:
                abstract, authors = fetch_crossref(doi=doi, title=title)
                time.sleep(1.0)
                chain_used = "crossref"

            if not authors:
                # Can't verify — leave as-is (conservative: keep the abstract we have)
                pm["patch9_check"] = "skipped_no_authors_available"
                continue

            check = patch9_check(authors, name)
            pm["patch9_check"] = {
                "accepted": check["accept"],
                "reason": check["reason"],
                "n_authors": check["n_authors"],
                "target_position": check["target_position"],
                "via": chain_used,
            }

            if not check["accept"]:
                flip_to_title_only(pm, d, check, src)
                filtered_indices.append(pm["paper_index"])
        elif src in ("arxiv_fulltext", "html_native", "pdf_pdftotext"):
            # Trust cached n_authors + author_position from tier filter.
            n = pm.get("n_authors") or 0
            pos = pm.get("author_position")
            if n > 20 and pos is not None:
                if not (pos <= 5 or pos >= n - 4):
                    # Tier C slipped through — reject
                    n_checked += 1
                    check = {"accept": False, "n_authors": n, "target_position": pos, "reason": "collaboration_filtered_arxiv_tier"}
                    pm["patch9_check"] = check
                    flip_to_title_only(pm, d, check, src)
                    filtered_indices.append(pm["paper_index"])
                else:
                    pm["patch9_check"] = {"accepted": True, "reason": "arxiv_tier_lead", "n_authors": n, "target_position": pos}
            else:
                pm["patch9_check"] = {"accepted": True, "reason": "arxiv_small_team_or_unknown_pos", "n_authors": n, "target_position": pos}

    deleted = invalidate_downstream(d, filtered_indices)

    ingest["patch9_applied"] = True
    ingest["patch9_timestamp"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    ingest["patch9_n_checked"] = n_checked
    ingest["patch9_n_filtered"] = len(filtered_indices)
    ingest["patch9_filtered_indices"] = filtered_indices
    ingest["patch9_downstream_deletions"] = deleted
    ingest["papers"] = papers
    ingest_path.write_text(json.dumps(ingest, indent=2))

    node_meta = {
        "pid": pid,
        "name": name,
        "n_papers": len(papers),
        "n_collaboration_filtered": len(filtered_indices),
        "manual_review": len(filtered_indices) >= 2,
        "patch9_timestamp": ingest["patch9_timestamp"],
    }
    (d / "node_meta.json").write_text(json.dumps(node_meta, indent=2))

    return {
        "pid": pid, "name": name,
        "n_papers": len(papers), "n_checked": n_checked,
        "n_filtered": len(filtered_indices),
        "filtered_indices": filtered_indices,
        "manual_review": len(filtered_indices) >= 2,
    }


def main():
    picks = json.loads((BASE / "picks.json").read_text())["picks"]
    print(f"Patch 9 strict collaboration filter across {len(picks)} faculty\n", flush=True)
    rollup = []
    for p in picks:
        result = process_person(p["id"], p["name"])
        if result.get("skipped"):
            rollup.append(result)
            continue
        if result.get("n_filtered", 0) > 0 or result.get("manual_review"):
            print(
                f"{result['pid']} {result['name']}: "
                f"checked={result['n_checked']} filtered={result['n_filtered']} "
                f"manual_review={result['manual_review']}",
                flush=True,
            )
        rollup.append(result)
    BASE.mkdir(parents=True, exist_ok=True)
    (BASE / "patch9_report.json").write_text(json.dumps(rollup, indent=2))
    filtered_total = sum(r.get("n_filtered", 0) for r in rollup if not r.get("skipped"))
    manual_total = sum(1 for r in rollup if r.get("manual_review"))
    print(f"\nSUMMARY: {filtered_total} papers flipped to title_only across {manual_total} faculty with manual_review")
    print(f"Wrote {BASE / 'patch9_report.json'}")


if __name__ == "__main__":
    main()
