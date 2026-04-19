# Matchmaking Pairs — task spec (v2)

Produce a small curated set of NBI-faculty collaboration abstracts — **one per section pair** — for the live matchmaking scene in the talk. Audience picks two sections, a fixed-but-visually-random picker lands on a specific faculty member in each, and the scene shows the pre-generated joint-grant abstract for that pair.

**Depends on:** `research-graph-spec.md` → `nbi_research_graph.json`.

The core selection criterion is **close W, distant P** — pairs whose ongoing work converges on a shared frontier despite different backgrounds. Those are the collaborations the institute doesn't already know about.

---

## Inputs

- `artifacts/nbi_research_graph.json` — 124 nodes with P and W embeddings, pairwise similarity arrays, co-authorship adjacency.
- `artifacts/nbi_faculty.json` — faculty master list (sections, ranks).

## Outputs

`artifacts/matchmaking_pairs.json`:

```json
{
  "generated_at_utc": "2026-04-19T…",
  "abstract_model": "claude-sonnet-4-6",
  "thresholds": { "tau_p_percentile": 25, "tau_w_percentile": 80 },
  "pairs": [
    {
      "section_a": "Cosmic Dawn Center (DAWN)",
      "section_b": "Quantum Optics",
      "a": { "id": "5469", "name": "Sune Toft", "rank": "…" },
      "b": { "id": "460432", "name": "Leonardo Midolo", "rank": "…" },
      "p_similarity": 0.14,
      "w_similarity": 0.71,
      "coauthored": false,
      "abstract_title": "…",
      "abstract": "…",
      "proposed_methods": ["…"],
      "budget_line": "~1.4M DKK · 3 years · 1 PhD + 1 postdoc",
      "threads_a": ["…"],
      "threads_b": ["…"],
      "traceability": [{ "claim": "…", "bullet_ref": "A-3" }]
    }
  ]
}
```

Rejections (pairs where Opus/Sonnet refused to ground a bridge) go to a parallel `artifacts/matchmaking_rejections.json` with `{section_a, section_b, a, b, reason}`.

Empty section pairs (no candidate survived filtering even after relaxation) go to `artifacts/matchmaking_empty.json` with `{section_a, section_b, reason}`.

---

## Pipeline

### 1. Threshold calibration

Across all cross-section pairs (exclude same-section) in the graph:

- Compute the distribution of P-similarities and W-similarities.
- Set **τ_P** = 25th percentile of cross-section P-similarities (bottom quarter for background similarity = "distant").
- Set **τ_W** = 80th percentile of cross-section W-similarities (top fifth for ongoing-work similarity = "close").

These are starting values. If fewer than 35/45 section pairs yield a candidate (78 %), relax: lower τ_W by 5 percentile points, repeat. If still short, raise τ_P by 5. Persist chosen thresholds in the output header.

### 2. Per-group-pair candidate selection

For each of the C(10, 2) = 45 unordered section pairs (A, B):

1. Enumerate every cross-section pair (a ∈ A, b ∈ B).
2. Filter:
   - `p_similarity(a, b) < τ_P` — distant background
   - `w_similarity(a, b) > τ_W` — close ongoing work
   - `not coauthored(a, b)` — no prior collaboration
   - Both `a` and `b` have ≥ 4 `main_ideas` or equivalent richness (thin profiles make the abstract flail; skip).
   - Neither is affiliate / emeritus (unless the section has no regular faculty).
3. **Rank survivors by W-similarity, descending.** Take top 1.
4. If no survivors: attempt two relaxations in order — (a) raise τ_P by 10 percentile points, (b) lower τ_W by 10. If still empty after both, emit to `matchmaking_empty.json` and move on.

### 3. Joint-abstract generation

For each selected pair, call the abstract model (Sonnet 4.6 default; Opus 4.7 if Sonnet rejects and the pair is rhetorically important).

Prompt — constraints are load-bearing; tested in `matchmaking-example-2` to produce honest rejections rather than fabricated bridges:

> *"Write a joint-grant abstract proposing a three-year collaboration between these two NBI faculty. 150 words. Physics-realistic, grant-quality tone. Follow with: (a) a title, (b) 3 bullet-point proposed methods, (c) a one-line budget placeholder (~1.4M DKK · 3 years · 1 PhD + 1 postdoc). Also return `threads_a` and `threads_b` arrays (3 strings each) naming the research threads drawn from each person, and a `traceability` array mapping each technical claim to its source bullet as `{claim, bullet_ref: \"A-3\"}`.*
>
> **CONSTRAINTS (load-bearing):**
> 1. *Use ONLY facts present in the supplied profiles. Every technical claim in the abstract must trace to at least one bullet from one of the two PIs.*
> 2. *Do NOT introduce specific numeric thresholds (fluxes, precisions, timescales, resolutions, wavelengths, sensitivities, detection limits) unless they appear verbatim in a profile bullet.*
> 3. *Do NOT use aspirational metrology language ('SI-traceable', 'NIST-traceable', 'standard reference', 'absolute calibration') unless the phrase appears in a profile bullet.*
> 4. *If you cannot find a plausible grounded bridge without adding ungrounded claims, return `{reject: true, reason: \"…\"}` instead. Honest rejection is preferable to fabrication — the talk demo samples the next pair on rejection.*
>
> Output JSON `{title, abstract, methods, budget, threads_a, threads_b, traceability}` OR `{reject, reason}`."*
>
> `PERSON A: { name, section, main_ideas, next_steps, surprising_findings, open_questions, tools_built }`
> `PERSON B: { same shape }`

Cache each call to `artifacts/corpus/abstracts/<section_a>__<section_b>.json`. Idempotent — re-runs hit cache.

### 4. Validation

- Every `traceability` entry resolves to a real profile bullet on the referenced person.
- No pair has `p_similarity > τ_P` or `w_similarity < τ_W` (after relaxations — record the effective thresholds used per pair).
- No pair is in the co-author set.
- Word counts on abstracts in [120, 180].

### 5. Export

Write `matchmaking_pairs.json` (accepted), `matchmaking_rejections.json` (refused bridges), `matchmaking_empty.json` (section pairs with no candidate). Every section pair appears in exactly one of the three.

---

## Constraints

- **Budget:** ≤ $10 API spend (~45 Sonnet calls at ~$0.05 each, plus a few Opus retries for important rejections).
- **Wall time:** ≤ 45 minutes.
- **Privacy:** output gitignored. Public sharing gated on per-faculty opt-in — downstream of this spec.
- **Idempotent:** re-runs hit cache; only re-run specific section pairs by clearing their cache entries.

## Downstream consumers

- Talk scene `matchmaking` — loads `matchmaking_pairs.json`, samples the pair matching the audience's two-section pick (deterministic lookup, not random — the "randomiser" visual is theatre).
- Standalone `/graph` page — clicking an edge shown on the 2D landscape surfaces the corresponding joint abstract if one exists.

## Out of scope

- Building the research graph (see `research-graph-spec.md`).
- Opt-in handling for public posting of generated abstracts.
- Live regeneration at talk time — all samples are from this static cache.
- The closing bang (separate, not graph-related).
