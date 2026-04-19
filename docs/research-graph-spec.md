# NBI Research Graph — task spec

Build a graph representation of the NBI institute's intellectual landscape: faculty as nodes, similarity-of-research as edges, backed by embeddings derived from full-text recent papers. This is a **general-purpose artifact** — downstream uses include (but are not limited to) the `matchmaking-pairs-spec.md` pipeline, a potential D3/force-directed visualisation scene in the talk, and future NBI strategic analyses.

This is a one-shot offline pipeline. Dispatch a capable agent (Claude Code or similar) with this file as the brief.

---

## Inputs

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_faculty.json` — 124 NBI faculty (assistant professor and above). Per entry: `display_name`, `title`, `rank_normalized`, `section`, `unit`, `email`, `pure_page`, `personal_page`, `recent_publication_titles` (≤5), `research_keywords`, `research_blurb`.

## Outputs

Write to:

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_research_graph.json`

Schema:

```json
{
  "generated_at_utc": "2026-04-19T…",
  "embedding_model": "text-embedding-3-large",
  "summariser_model": "claude-sonnet-4-6",
  "nodes": [
    {
      "id": "143217",
      "name": "Andersen, Anja C.",
      "section": "Astrophysics and Planetary Science",
      "rank": "professor",
      "main_ideas": ["…", "…"],
      "next_steps": ["…", "…"],
      "embedding": [/* 3072 floats */],
      "source_text": "NAME · SECTION · RANK\n\nRecent research:\n- …\n\nStated next steps:\n- …"
    }
  ],
  "edges": [
    { "a": "143217", "b": "…", "cosine_distance": 0.37 }
  ]
}
```

Per-faculty working files under `artifacts/corpus/`:
- `papers/<id>/paper_<i>.pdf` — raw PDFs
- `summaries/<id>.json` — aggregated main ideas + next steps

All gitignored. This cache contains real researcher signals; do not commit.

---

## Pipeline

### 1. Paper ingest (full text, top 3 per person)

For each faculty:

- Prefer arXiv. Resolve author via arXiv export API with the **exact-phrase query** `au:"First Last"` — learned from the pipeline proof that `au:Surname_Initial` pulls large consortium papers where the target is author #150/300 and not representative of their intellectual fingerprint.
- Apply a **lead-author filter** tiered as follows when selecting the 3 papers from the matched pool, taking most recent first within each tier:
  - **Tier A (preferred):** `author_position ≤ 3` OR `author_position ≥ (n_authors − 2)` — first or last 3 slots.
  - **Tier B (fallback):** `author_position ≤ 5` OR `author_position ≥ (n_authors − 4)`.
  - **Tier C (last resort):** any position.
  - Fill the 3-paper quota from Tier A first; drop to Tier B only if Tier A yields < 3; drop to Tier C only if B still yields < 3.
  - Large consortium papers (Euclid, ATLAS, DESI, JWST treasury surveys) where the person is deep in the author list should be filtered out at Tier A.
- Log every accepted / rejected paper with the tier and author position — persists in `artifacts/corpus/ingest_log/<id>.json` for audit.
- Fall back to Pure (`pure_page` in the faculty JSON) only if Tiers A+B+C on arXiv together yield fewer than 3. Pure "Publications" tabs expose direct PDF links.
- Rate limit 1 req/sec per host.
- Expect ~10–20 % fallback to Pure for non-arXiv-native sections (Biophysics, Climate & Geophysics).

### 2. Per-paper summarisation

For each downloaded PDF:

- Parse to text (`pdftotext`, `pypdf`).
- Send abstract + introduction + conclusion sections (cap ~12k tokens) to Claude Sonnet 4.6 with prompt:
  > *"From this paper, extract (a) 3 bullets summarising the main scientific ideas, (b) 2 bullets capturing the stated or implied next steps. Output JSON: `{main_ideas: string[], next_steps: string[]}`."*
- Cache to `artifacts/corpus/summaries/<id>/paper_<i>.json`.

Aggregate per faculty: union across 3 papers, dedupe near-identical bullets (cosine similarity > 0.92 on bullet embeddings), keep ≤ 6 main ideas and ≤ 4 next steps.

### 3. Faculty-level embedding

Compose a per-faculty document:

```
NAME · SECTION · RANK

Recent research:
- <main_idea_1>
- …

Stated next steps:
- <next_step_1>
- …
```

Embed with `text-embedding-3-large` (3072-dim). Store in the node record.

### 4. Edge weights

Compute cosine distance for all C(124, 2) = **7,626 pairs**. Include every pair in the `edges` array, sorted by distance ascending. Downstream consumers can threshold as they see fit.

### 5. Export

Write `nbi_research_graph.json` per the schema above. Validate:

- 124 nodes, 7,626 edges, no missing embeddings
- Mean bullet count per node ≥ 3
- Re-load and spot-check 5 random nodes for summary quality

---

## Constraints

- **Budget:** ≤ $10 total API spend (most of the cost is in step 2).
- **Wall time:** ≤ 3 hours on a laptop with normal connection.
- **Privacy:** all output gitignored.
- **Reproducible:** save the summariser prompt text alongside the graph, so downstream re-runs can detect spec drift.

## Downstream consumers (not in scope here)

- `matchmaking-pairs-spec.md` — selects 30 stratified pairs and generates joint-grant abstracts.
- Potential talk visualisation: render the graph as a force-directed D3/WebGL scene (nodes coloured by section, edge opacity by similarity). Would be a cool Act 3 visual if Daniel wants it.
- Future NBI strategic analyses.

## Out of scope

- Pair selection, abstract generation (see `matchmaking-pairs-spec.md`).
- Visualisation (belongs in the talk app, not the pipeline).
- Opt-in filtering for public sharing (downstream).
