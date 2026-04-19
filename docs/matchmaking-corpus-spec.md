# Matchmaking Corpus Pipeline — task spec

Pre-generate a cache of ~30 NBI-faculty joint-collaboration abstracts for the live `matchmaking` scene in the talk. The demo samples from this cache during the talk and presents a "randomly sampled" pair with its pre-written joint abstract.

This is a one-shot offline pipeline. Dispatch a capable agent (Claude Code or similar) with this file as the brief.

---

## Inputs

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_faculty.json` — 124 NBI faculty entries (asst prof and above). Fields available per entry: `display_name`, `title`, `rank_normalized`, `section`, `unit`, `email`, `pure_page`, `personal_page`, `recent_publication_titles` (≤5), `research_keywords`, `research_blurb`.

## Outputs

Write to:

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/matchmaking_pairs.json`

Schema:

```json
{
  "generated_at_utc": "2026-04-19T…",
  "model": "claude-sonnet-4-6",
  "embedding_model": "text-embedding-3-large",
  "pairs": [
    {
      "bucket": "near" | "mid" | "far",
      "distance": 0.37,
      "a": { "id": "…", "name": "…", "section": "…", "rank": "…",
              "threads": ["…","…","…"] },
      "b": { …same shape… },
      "abstract_title": "…",
      "abstract": "150-word joint-grant abstract …",
      "proposed_methods": ["…","…","…"],
      "budget_line": "~1.4M DKK · 3 years · 1 PhD + 1 postdoc"
    }
  ]
}
```

Also write per-faculty working files under `artifacts/corpus/`:
- `papers/<id>/paper_<i>.pdf` — raw PDFs
- `summaries/<id>.json` — main ideas + next steps per person (aggregated across their 3 papers)
- `embeddings/<id>.json` — embedding vector + source text

These are gitignored by design. They contain real faculty research signals.

---

## Pipeline

### 1. Paper ingest (target: full text, top 3 per person)

For each faculty:

- Prefer arXiv as the source. Resolve the author via the arXiv search API (`http://export.arxiv.org/api/query?search_query=au:%22Surname_Given%22`) — match against the faculty's name + their institutional affiliation if present in the abstract.
- Take the 3 most recent submissions, preferring first-author where tied on date.
- Fall back to Pure if arXiv yields < 3 hits. The Pure profile links are in `pure_page`; most Pure pages expose a "Publications" tab with direct PDF links.
- Download PDFs to `artifacts/corpus/papers/<id>/paper_<i>.pdf`. Rate limit 1 req/sec per host.
- Some NBI subsections (notably Biophysics, Climate & Geophysics) are not arXiv-native. Expect ~10–20 % fallback to Pure.

### 2. Per-paper summarisation

For each downloaded PDF:

- Parse to text (`pdftotext`, `pypdf`, or equivalent).
- Send the abstract + introduction + conclusion sections (capped at ~12k tokens) to Claude Sonnet 4.6 with the prompt:
  > *"From this paper, extract (a) 3 bullets summarising the main scientific ideas, (b) 2 bullets capturing the stated or implied next steps. Output JSON: `{main_ideas: string[], next_steps: string[]}`."*
- Cache in `artifacts/corpus/summaries/<id>/paper_<i>.json`.

Aggregate per faculty: union across their 3 papers, deduplicate near-identical bullets, keep at most 6 main ideas and 4 next steps per person.

### 3. Faculty-level embedding

Compose a corpus document per faculty:

```
NAME · SECTION · RANK

Recent research:
- <main_idea_1>
- <main_idea_2>
- ...

Stated next steps:
- <next_step_1>
- ...
```

Embed with `text-embedding-3-large` (3072-dim). Store `{id, vec, source_text}` in `artifacts/corpus/embeddings/<id>.json`.

### 4. Pairwise distance matrix

Compute cosine distance for all C(124, 2) = **7,626 pairs**. Use `numpy` broadcasting or `sklearn.metrics.pairwise.cosine_distances`. Sort pairs ascending by distance.

### 5. Pair selection — 30 curated, stratified

Target distribution:

- **10 NEAR** — top 5 % of pairs by proximity. Filter: exclude same-section pairs (we want *inter-group* even for close pairs — a surprise inside the surprise).
- **10 MID** — middle quartile (roughly 40th–60th percentile). Filter: no constraint beyond distance.
- **10 FAR** — bottom 5 % of pairs by proximity. Filter: exclude pairs where either person has < 2 usable main_ideas (the generation will flail).

Additional guards: never pair the same person twice across the 30; never pair an emeritus/affiliate with another emeritus/affiliate.

### 6. Joint-abstract generation

For each selected pair, call Claude Opus (or Sonnet 4.6 for cost) with:

> *"Write a joint-grant abstract proposing a three-year collaboration between these two NBI faculty. 150 words. Physics-realistic, grant-quality tone. Follow with: (a) a title, (b) 3 bullet-point proposed methods, (c) a one-line budget placeholder (~1.4M DKK · 3 years · 1 PhD + 1 postdoc). Also return: a `threads_a` array of 3 strings naming the research threads of person A that the abstract draws from, and `threads_b` for person B. Output JSON."*
>
> `PERSON A: {name, section, research: …}`
> `PERSON B: {name, section, research: …}`

### 7. Export

Write `matchmaking_pairs.json` per the schema above. Validate: 30 entries, no duplicates, bucket counts balanced, abstract word counts 120–180.

---

## Constraints

- **Budget:** ≤ $20 total API spend.
- **Wall time:** ≤ 4 hours on a laptop with ~20 Mbit connection.
- **No CI.** This is a one-shot. Re-run manually if faculty list changes.
- **Privacy:** all output is gitignored. Never commit `artifacts/`. Pair output will eventually be published to a public GH page **only for explicitly opted-in faculty** — the spec does not handle opt-in; that's a downstream filter.

---

## Implementation hints

- `arxiv` Python package handles the search/download + rate limiting.
- Parallelise cautiously: max 3 concurrent paper summarisation calls to Claude.
- Dedup detection: cosine similarity on bullet embeddings > 0.92 → merge.
- For abstract generation, cache the full prompt → response pair to `artifacts/corpus/abstracts/<pair_id>.json` so re-runs are cheap.

## Validation before handing back

- Spot-check 5 abstracts manually for physics-plausibility.
- Verify bucket distribution (10/10/10).
- Confirm all 60 distinct faculty appear at least once (60 unique across 30 pairs).
- Confirm no pair shares a section in the NEAR bucket.

---

## Out of scope

- Opt-in handling for public sharing of generated abstracts — handled by the talk app, not this pipeline.
- Live re-generation at talk time — the demo samples from the static cache.
- The closing-bang content — that uses a different pipeline (see task #16).
