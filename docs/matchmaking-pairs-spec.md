# Matchmaking Pairs — task spec

Produce a small curated set of interdisciplinary NBI-faculty pairings with joint-grant-style proposal abstracts, for the live `matchmaking` scene in the talk. The demo samples from this cache and presents a pair as if drawn live.

**Depends on:** `research-graph-spec.md` (which produces `nbi_research_graph.json`).

Separated from the graph spec because the graph is a general-purpose artifact and the pairs are a specific talk-demo product. Split lets either evolve independently.

---

## Inputs

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/nbi_research_graph.json` — the research graph produced by the graph spec. Nodes carry `main_ideas`, `next_steps`, and embeddings; edges carry pairwise cosine distances.

## Outputs

Write to:

- `/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/matchmaking_pairs.json`

Schema:

```json
{
  "generated_at_utc": "2026-04-19T…",
  "abstract_model": "claude-opus-4-7",
  "graph_generated_at_utc": "…",
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

Per-pair working cache at `artifacts/corpus/abstracts/<pair_id>.json` so re-runs are cheap.

---

## Pipeline

### 1. Pair selection — 30 curated, stratified

From the graph's edges, select:

- **10 NEAR** — top 5 % of pairs by proximity. **Filter: exclude same-section pairs** (we want *inter-group* even for close pairs — a surprise inside the surprise).
- **10 MID** — middle quartile (≈ 40th–60th percentile). No additional filter.
- **10 FAR** — bottom 5 % by proximity (largest cosine distance). **Filter: exclude pairs where either node has < 2 usable `main_ideas`** — the synthesis flails without enough to anchor on.

Global guards:

- Never pair the same person twice across the 30.
- Never pair two affiliate / emeritus entries together.
- If your selection over-represents any single section (> 5 appearances), swap in the next-best candidate.

### 2. Joint-abstract generation

For each selected pair, call Claude Opus 4.7 (or Sonnet 4.6 for ~5× cost savings) with:

> *"Write a joint-grant abstract proposing a three-year collaboration between these two NBI faculty. 150 words. Physics-realistic, grant-quality tone. Follow with: (a) a title, (b) 3 bullet-point proposed methods, (c) a one-line budget placeholder (~1.4M DKK · 3 years · 1 PhD + 1 postdoc). Also return: a `threads_a` array of 3 strings naming the research threads of person A that the abstract draws from, and `threads_b` for person B. Output JSON."*
>
> `PERSON A: { name, section, main_ideas, next_steps }`
> `PERSON B: { name, section, main_ideas, next_steps }`

Cache each call to `artifacts/corpus/abstracts/<pair_id>.json`.

### 3. Export

Write `matchmaking_pairs.json` per the schema. Validate:

- 30 entries, 10/10/10 bucket balance
- All 60 node IDs distinct (every pair introduces 2 new faces)
- Abstract word counts 120–180
- No NEAR pair shares a section
- Threads arrays non-empty

---

## Constraints

- **Budget:** ≤ $10 API spend (30 × one Opus call at ~$0.25 each, plus some Sonnet retries).
- **Wall time:** ≤ 40 minutes.
- **Privacy:** all output gitignored. Public sharing is gated on explicit per-pair opt-in collected separately by Daniel.
- **Idempotent:** re-running should hit cache for abstracts already generated.

## Out of scope

- Building the research graph (see `research-graph-spec.md`).
- Opt-in handling for public posting of generated abstracts.
- Live regeneration at talk time — the demo samples from this static cache.
- The closing bang (separate, not graph-related).
