# NBI Research Graph — task spec (v2)

Build a faculty intellectual landscape with **two complementary embeddings per person**:

- **P — background profile.** Where they've been for years. Derived from their ~10 most recent arXiv abstracts, compressed into 5–8 distinguishing sentences.
- **W — ongoing work.** What they're converging on now. Derived from full-text reading of their 3 most recent lead-author papers, extracting (1) stated next steps, (2) surprising findings, (3) open questions, (4) tools they built.

This two-vector representation enables the matchmaking criterion that makes interdisciplinary collaborations real: *close W, distant P* — people converging on the same frontier from different starting points. See `matchmaking-pairs-spec.md`.

The graph is also a **general-purpose artifact**. Downstream uses:
- `matchmaking-pairs-spec.md` — selects 45 group-pair collaboration abstracts.
- Talk scene `researchGraph` — UMAP-rendered NBI landscape with W-bridges crossing section clusters, as the opening beat of Act 3.
- Standalone `/graph` page — interactive version for NBI to browse after the talk.
- Future NBI strategic analyses.

One-shot offline pipeline. Dispatch with this file as the brief.

---

## Inputs

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_faculty.json` — 124 NBI faculty (asst prof and above).

## Outputs

`/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_research_graph.json`

Schema:

```json
{
  "generated_at_utc": "2026-04-19T…",
  "embedding_model": "text-embedding-3-large",
  "summariser_model": "claude-sonnet-4-6",
  "nodes": [
    {
      "id": "5469",
      "name": "Sune Toft",
      "section": "Cosmic Dawn Center (DAWN)",
      "rank": "professor",
      "background_text": "5–8 distinguishing sentences …",
      "ongoing_text": "explicit points · stated next steps … · surprising findings … · open questions … · tools …",
      "p_vec": [/* 3072 floats */],
      "w_vec": [/* 3072 floats */],
      "coords_2d": [2.34, -1.87]
    }
  ],
  "edges_p": [{ "a": "5469", "b": "…", "cosine_similarity": 0.81 }],
  "edges_w": [{ "a": "5469", "b": "…", "cosine_similarity": 0.62 }],
  "coauthored": [{ "a": "5469", "b": "…" }]
}
```

Per-faculty working cache under `artifacts/corpus/<id>/` — gitignored. Keep `background_candidates/` (10 abstract excerpts), `papers/` (3 full PDFs), `ongoing_extracts/` (structured bullet set per paper), `profile.json` (aggregated per-person), `authors.json` (paper author lists for the co-author step).

---

## Pipeline

### 0. Shared per-faculty cache (cross-run)

Canonical path: **`/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/corpus/<faculty_id>/`**. This path is shared across every invocation of the pipeline — pilots, full runs, selective re-runs. Expensive operations (arXiv fetches, PDF downloads, Claude summary calls, OpenAI embedding calls) cache their output here and **skip on re-invocation if the cache file is non-empty**.

Layout under `corpus/<id>/`:

```
background_candidates.json   # step 1 output: the 10 abstracts + metadata
background_text.json         # step 2 output: {text, model, timestamp}
papers.json                  # step 3 output: arXiv matches + tier log
papers/paper_{1,2,3}.pdf     # step 3 output: downloaded PDFs
papers/paper_{1,2,3}.txt     # step 3 output: pdftotext dump
papers/paper_{1,2,3}_extracted.json  # step 3 output: abstract+intro+conclusion
summaries/paper_{1,2,3}.json # step 4 output: per-paper bullet extraction
ongoing_text.json            # step 5 output: aggregated ongoing paragraph
embedding.json               # step 6 output: {p_vec, w_vec, model, dims}
authors.json                 # step 8 input: union of author names from all fetched papers
```

**Cache-hit rule:** each step checks for the presence of its own output files at the start; if every file the step would produce already exists and is non-empty, the step skips and logs `cache_hit: <id>`. If only some exist (partial failure in a prior run), the step reprocesses the missing pieces only.

**Cache invalidation:** manual — delete the file(s) to force reprocessing. Optional soft version key on each file: if the agent's code version (git SHA) differs from the `produced_by_commit` recorded in the file, log a warning but still use the cache (unless `--force` flag). Spec-level prompt changes require deleting the corresponding cache files (`background_text.json`, `summaries/*.json`, etc.) across all faculty.

**Graph output paths are separate and NOT cached** — `nbi_research_graph.json` is rebuilt from the per-faculty cache on every run. Different runs can produce to different output paths (e.g., `artifacts/pilot/…`, `artifacts/pilot-v3/…`, `artifacts/nbi_research_graph.json`) without interfering with each other.

### 1. Background corpus: latest ~10 arXiv abstracts per person

- Query arXiv with exact-phrase `au:"First Last"` (never `au:Surname_Initial` — that fires on Euclid/ATLAS consortium papers where the target is author #150 / 300).
- **Patch 3 — name-collision defence.** Restrict every arXiv query to the categories appropriate for the faculty member's section. Without this, common surnames (`"Gang Chen"`, `"Jörg Müller"`) pull ML/robotics papers from unrelated researchers. Section → categories mapping:

```json
{
  "Cosmic Dawn Center (DAWN)":               ["astro-ph.CO", "astro-ph.GA", "astro-ph.HE", "astro-ph.IM", "astro-ph.SR", "gr-qc"],
  "Dark Cosmology Centre (DARK)":            ["astro-ph.CO", "astro-ph.GA", "astro-ph.HE", "gr-qc", "hep-ph"],
  "Astrophysics and Planetary Science":      ["astro-ph.EP", "astro-ph.GA", "astro-ph.HE", "astro-ph.IM", "astro-ph.SR", "physics.space-ph"],
  "Niels Bohr International Academy":        ["astro-ph.CO", "astro-ph.HE", "gr-qc", "hep-th", "hep-ph", "cond-mat.stat-mech", "quant-ph"],
  "Theoretical Particle Physics and Cosmology": ["hep-th", "hep-ph", "gr-qc", "astro-ph.CO", "astro-ph.HE"],
  "Experimental Subatomic Physics":          ["hep-ex", "nucl-ex", "hep-ph", "physics.ins-det", "physics.acc-ph"],
  "Quantum Optics":                          ["quant-ph", "physics.optics", "physics.atom-ph", "cond-mat.mes-hall", "cond-mat.quant-gas"],
  "Condensed Matter Physics":                ["cond-mat.mes-hall", "cond-mat.str-el", "cond-mat.supr-con", "cond-mat.quant-gas", "cond-mat.stat-mech", "cond-mat.soft", "cond-mat.dis-nn", "cond-mat.mtrl-sci", "quant-ph"],
  "Biophysics":                              ["physics.bio-ph", "cond-mat.soft", "q-bio.BM", "q-bio.CB", "q-bio.SC", "q-bio.PE", "q-bio.TO", "q-bio.QM"],
  "Climate and Geophysics":                  ["physics.geo-ph", "physics.ao-ph", "physics.flu-dyn", "physics.ocean-ph"]
}
```

Full arXiv query takes the form `au:"First Last" AND (cat:<c1> OR cat:<c2> OR ...)`. Categories should be OR-joined in the query.

- Keep the 10 most recent abstracts that pass the category filter, regardless of author position (background is inclusive on author position; strict on subject).
- If fewer than 5 candidates survive the category filter (the faculty may publish in an unlisted category), log the shortfall, then retry with no category filter but flag the person for manual review in the final report.
- Store raw abstracts in `artifacts/corpus/<id>/background_candidates/`.

### 2. Background synthesis: 5–8 distinguishing sentences

Prompt Sonnet 4.6 (first pass):

> *"Read these 10 recent arXiv abstracts from <Name> (<Section>). Write 5–8 sentences describing their research background. Each sentence must be specific enough to distinguish them from the section average — avoid generic phrases like 'studies the early universe' or 'works on machine learning.' Mention concrete tools, methods, systems, or questions that appear repeatedly across the abstracts."*

Then a specificity-check pass (Sonnet, cheap):

> *"Flag any sentence that could appear verbatim in the background of any other researcher in <Section>. Rewrite those to name specific methods, systems, or questions from the abstracts."*

Persist final text as `background_text` on the node.

### 3. Ongoing-work corpus: 3 lead-author papers full text

- Query arXiv with exact-phrase `au:"First Last"` AND the section-category filter from step 1 (Patch 3 applies here too — otherwise the lead-author filter can still latch onto the wrong human if they happen to be a first-author ML paper).
- **Patch 6 — Unicode-tolerant author matching.** Normalise both the faculty query name and every arXiv-returned author name with `unicodedata.normalize("NFKD", s)` + strip combining chars before comparing. Without this, any faculty whose surname contains diacritics (Vaitiek**ė**nas, M**ü**ller, Fl**ø**e, Damg**å**ard, et al.) gets `author_position = None` on 80–90 % of candidates because arXiv stores the character but the query string is ASCII — silent fall-through past Tier A onto stale older papers. Apply NFKD normalisation inside `author_position()` and inside the co-author adjacency name-match.
- Apply the tiered lead-author filter:
  - **Tier A:** `author_position ≤ 3` OR `author_position ≥ (n_authors − 2)`
  - **Tier B:** `author_position ≤ 5` OR `author_position ≥ (n_authors − 4)`
  - **Tier C:** any position (last resort).
- Keep the 3 most recent papers passing Tier A; fall through to B, then C.
- **Patch 4 — Pure fallback with real abstracts.** If Tiers A+B+C on arXiv yield < 3, fall back to Pure at `researchprofiles.ku.dk` (URL is in `pure_page` on the faculty JSON). Do not stop at publication titles — fetch the individual publication pages (`/en/publications/<uuid>`) and scrape the abstract field. These are the canonical publication records for NBI staff, including geoscience/biophysics/etc. faculty who publish primarily in non-arXiv journals. Rate limit 1 req/sec. Skip publications older than 3 years (we want *recent* work). Keep up to 10 for the background step, and up to 3 for the ongoing-work step (Pure doesn't expose full PDFs reliably, so for these people the ongoing_text is built from abstracts rather than full papers — log the shallower treatment in the node).

- **Patch 8 — Multi-source abstract chain (never fall back to titles alone).** Pure's own publication page sometimes has a title and metadata but no abstract field populated. Previously this bottomed out at a title-only synthesis which is a confabulation risk. New fallback chain, per Pure publication, in order — stop at the first that yields a non-empty abstract:
  1. **Pure page itself** — `.rendering_abstractportal .textblock` (Patch 4 path).
  2. **INSPIRE-HEP** — `GET https://inspirehep.net/api/literature?q=arxiv:<arxiv_id> OR doi:<doi> OR title:"<title>"&fields=titles,abstracts&size=1`. Returns structured `abstracts[].value`. **Perfect coverage for HEP** (tested on ATLAS Higgs paper: full real abstract returned). Try this for every publication regardless of section — non-HEP misses cost one request with 0 hits.
  3. **OpenAlex** — `GET https://api.openalex.org/works/doi:<doi>` or `/works/arxiv:<arxiv_id>`. Returns `abstract_inverted_index`; reconstruct to text by sorting `(position, word)` pairs. Coverage ~250M works with known publisher gaps (Elsevier journals sometimes empty, spot-checked on ATLAS Higgs → `abstract_len: 0`). Good generalist catch.
  4. **Crossref** — `GET https://api.crossref.org/works/<doi>`. `message.abstract` sometimes populated; last-resort generalist source.
  5. **Dead-end:** if every tier misses, mark the publication as `abstract_source: "title_only"` and **exclude it from the ongoing corpus** (do not let it contaminate `main_ideas` / `next_steps`). If this leaves the faculty with fewer than 2 sources, set `selection_tier: "title_only_no_abstracts_found"` and `manual_review: true` on the node; have the ongoing-paragraph synthesiser emit a placeholder string like `"[manual review required — no abstracts available for this faculty member]"` rather than fluent prose.

  Persist per-publication `abstract_source ∈ {"arxiv_fulltext", "pure_page", "inspire_hep", "openalex", "crossref", "title_only"}` in the ingest log so the coverage ladder is auditable. Total extra cost at N=124 scale: INSPIRE-HEP + OpenAlex are free; Crossref is free. Adds ≤ 3 s wall per Pure-fallback paper.
- **Patch 5 — HTML-first fetch.** For each selected paper, try the native arXiv HTML endpoint **before** the PDF:
  1. `GET https://arxiv.org/html/<id>` (or `<id>v<N>` if the specific version is needed).
  2. HTTP 200 → parse the HTML. Section markers are already semantic (`<section>`, `<h1>`/`<h2>` with titles like *"I Introduction"*, *"VII Conclusions"*). Equations preserved as MathML. Extract abstract + intro + conclusion from the tagged tree — no regex on pdftotext dumps.
  3. HTTP 404 or unrenderable → fall back to the PDF path: download PDF, run `pdftotext`, regex-extract sections as before.
  4. Log the source per paper in the ingest log (`html_native` / `pdf_pdftotext`). Expect ~80–90% coverage on 2024+ papers; near-zero on pre-2020 papers. Coverage should be logged per-run so we can track arXiv's HTML rollout.
  Payload size: HTML is typically 250–500 KB vs PDFs at 3–17 MB — a 10–40× reduction in transfer + parse time.
- Persist ingest log at `artifacts/corpus/<id>/ingest_log.json`, including the source (`arxiv_tier_A` / `arxiv_tier_B` / `arxiv_tier_C` / `pure_abstract`) and fetch method (`html_native` / `pdf_pdftotext`) per paper.

### 4. Ongoing-work extraction: four explicit categories

For each paper, prompt Sonnet 4.6:

> *"From this paper, extract up to 4 items in each of these categories, as specific short bullets:*
> *— `next_steps`: next investigations the authors explicitly state they will undertake.*
> *— `surprising_findings`: results the authors flag as unexpected or in tension with prior expectation.*
> *— `open_questions`: things the authors explicitly say they don't yet understand.*
> *— `tools_built`: new methods, code frameworks, datasets, instruments, or benchmarks the authors built in this paper.*
> *Output JSON with these four arrays; fewer items per category is fine if the paper doesn't support more."*

Aggregate per person across 3 papers; dedup near-identical bullets (cosine similarity > 0.92 on bullet embeddings).

### 5. Ongoing-work description: one paragraph per person

Prompt Sonnet 4.6:

> *"Here are <Name>'s extracted next_steps, surprising_findings, open_questions, and tools_built across their 3 most recent lead-author papers. Write a single paragraph (≤ 120 words) describing their current frontier — what they're about to do next, what puzzles they're chasing, what they just built. Be specific. Avoid general framing about the field."*

Persist as `ongoing_text`.

### 6. Embeddings

- `p_vec` = `text-embedding-3-large(background_text)`.
- `w_vec` = `text-embedding-3-large(ongoing_text)`.
- Both 3072-dim.

### 7. Pairwise similarity matrices

- `edges_p` = cosine similarity across all C(124, 2) = 7,626 pairs, in P.
- `edges_w` = same pairs, in W.

Keep all edges (not just top-k) — downstream filters decide thresholds.

### 8. Co-authorship adjacency

For each paper fetched at steps 1 and 3, persist the full author list to `authors.json` per faculty. Build a cross-faculty adjacency:

- Primary: name-match across author lists. Two faculty co-authored iff at least one fetched paper lists both.
- Normalize names (remove middle initials, lowercase, strip accents) for matching.
- Output `coauthored` as a list of unordered pairs.

This catches explicit collaborators. It won't catch pairs who co-authored a paper outside the 13 fetched per person — but those are rare enough that a single false negative in 7,626 pairs is acceptable. Optional upgrade: one additional arXiv query per candidate pair flagged by the matchmaking filter.

### 9. 2D layout for visualisation

Run UMAP (`n_neighbors=15, min_dist=0.3, metric='cosine', n_components=2`) on the stack of 124 `p_vec`s. Persist per-node `coords_2d`.

Section clusters should be visibly separated in the 2D space (by construction — same-section researchers have similar P). If they're not, tune UMAP hyperparameters and document the choice.

### 10. Export

Write `nbi_research_graph.json`. Validate:

- 124 nodes. No missing embeddings.
- 7,626 edges in each of `edges_p` and `edges_w`.
- Mean bullet count per node ≥ 3 in each ongoing category.
- 2D coords in reasonable range (no NaN, no point > 20 units from origin).
- Spot-check: at least 5 same-section pairs have P-similarity > 0.7; at least 5 cross-section pairs have P-similarity < 0.3. Empirical sanity check.

---

## Constraints

- **Budget:** ≤ $15 API spend (expectation: ~$5 summaries + ~$1 embeddings; headroom for retries).
- **Wall time:** ≤ 5 hours.
- **Privacy:** output gitignored. Public exposure gated by per-faculty opt-in downstream.
- **Reproducible:** persist all prompts alongside the graph so spec drift is detectable on re-runs.

## Downstream consumers (not in scope here)

- `matchmaking-pairs-spec.md` — group-pair matches via threshold-AND-ranked W/P selection.
- Talk scene `researchGraph` — renders `coords_2d` + `edges_w` with section-coloured nodes and bright cross-section W-bridge edges. Proposed position: first beat of Act 3 matchmaking, before the audience prompt.
- Standalone `/graph` page in the stage app — same data, interactive (pan, zoom, hover a node to see their background + ongoing profiles, click an edge to see the joint abstract if one exists).
