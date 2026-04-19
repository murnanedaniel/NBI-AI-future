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

### 1. Background corpus: latest ~10 arXiv abstracts per person

- Query arXiv with exact-phrase `au:"First Last"` (never `au:Surname_Initial` — that fires on Euclid/ATLAS consortium papers where the target is author #150 / 300).
- Keep the 10 most recent, regardless of author position (background is inclusive).
- Store the raw abstracts in `artifacts/corpus/<id>/background_candidates/`.

### 2. Background synthesis: 5–8 distinguishing sentences

Prompt Sonnet 4.6 (first pass):

> *"Read these 10 recent arXiv abstracts from <Name> (<Section>). Write 5–8 sentences describing their research background. Each sentence must be specific enough to distinguish them from the section average — avoid generic phrases like 'studies the early universe' or 'works on machine learning.' Mention concrete tools, methods, systems, or questions that appear repeatedly across the abstracts."*

Then a specificity-check pass (Sonnet, cheap):

> *"Flag any sentence that could appear verbatim in the background of any other researcher in <Section>. Rewrite those to name specific methods, systems, or questions from the abstracts."*

Persist final text as `background_text` on the node.

### 3. Ongoing-work corpus: 3 lead-author papers full text

- Query arXiv with exact-phrase `au:"First Last"`, then apply the tiered lead-author filter:
  - **Tier A:** `author_position ≤ 3` OR `author_position ≥ (n_authors − 2)`
  - **Tier B:** `author_position ≤ 5` OR `author_position ≥ (n_authors − 4)`
  - **Tier C:** any position (last resort).
- Keep the 3 most recent papers passing Tier A; fall through to B, then C.
- Fall back to Pure only if Tiers A+B+C on arXiv yield < 3.
- Download PDFs, extract text via `pdftotext`, parse abstract + intro + conclusion sections (same as `matchmaking-example-2` pipeline).
- Persist ingest log at `artifacts/corpus/<id>/ingest_log.json`.

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
