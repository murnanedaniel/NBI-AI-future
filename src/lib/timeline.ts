export type SceneId =
  | "title"
  | "rateRamp"
  | "gnnSolution"
  | "speedJourney"
  | "loopsViz"
  | "quirksAside"
  | "innerLoopHistory"
  | "loopsVizMiddle"
  | "loopsVizOuter"
  | "easter1Release"
  | "easter2Bug"
  | "rorvigRunPhone"
  | "easter5Dispatch"
  | "easter3SmokingGun"
  | "easter4CrossEval"
  | "easter6Architecture"
  | "easter7Discovery"
  | "easter8Reveal"
  | "easter9Thesis"
  | "easter10WhyPossible"
  | "calendarFlip"
  | "act3Preamble"
  | "statsFeint"
  | "scienceDashToday"
  | "faculty2031Morning"
  | "nbiGraph"
  | "matchmaking"
  | "faculty2031Teaching"
  | "reverseLectureEvidence"
  | "phdPedagogy"
  | "nbiAINativeCallToAction"
  | "claudeFinalSlide";

export type Theme = "dark" | "light";

export type Scene = {
  id: SceneId;
  label: string;
  act: 1 | 2 | 3 | 4;
  startSec: number;
  endSec: number;
  steps: number;
  // theme is now derived from `act` in Stage.tsx (act >= 3 → light).
  // Field retained for backwards compatibility with anything that reads it.
  theme?: Theme;
};

// Per-paragraph timing from the storyboard plan.
// Total: 1170 s = 19:30. ~30 s spread budget for transitions.
export const SCENES: Scene[] = [
  // Para 1 (0:00–1:02)
  { id: "title",                  label: "Title",                          act: 1, startSec: 0,    endSec: 27,   steps: 1 },
  { id: "rateRamp",               label: "40 million per second",          act: 1, startSec: 27,   endSec: 62,   steps: 6 },

  // Para 2 (1:02–2:06)
  { id: "gnnSolution",            label: "Graph tracking on a real event", act: 1, startSec: 62,   endSec: 113,  steps: 4 },
  { id: "speedJourney",           label: "From 60 s to 100 kHz",           act: 1, startSec: 113,  endSec: 126,  steps: 4 },

  // Para 3 (2:06–3:15) — inner loop framing
  { id: "loopsViz",               label: "Inner loop · rotating",          act: 2, startSec: 126,  endSec: 148,  steps: 1 },
  { id: "quirksAside",            label: "Quirks · highly non-helical",    act: 2, startSec: 148,  endSec: 165,  steps: 2 },
  { id: "innerLoopHistory",       label: "NN history · 38 years",          act: 2, startSec: 165,  endSec: 188,  steps: 2 },
  { id: "loopsVizMiddle",         label: "Inner → middle loops",           act: 2, startSec: 188,  endSec: 195,  steps: 2 },

  // Para 4 (3:15–4:55)
  { id: "easter1Release",         label: "Easter · ColliderML release",    act: 2, startSec: 195,  endSec: 207,  steps: 1 },
  { id: "easter2Bug",             label: "Easter · bug email",             act: 2, startSec: 207,  endSec: 235,  steps: 1 },
  { id: "easter3SmokingGun",      label: "Easter · beamspot + smoking gun", act: 2, startSec: 235,  endSec: 262,  steps: 3 },
  { id: "rorvigRunPhone",         label: "Easter · Rørvig run (phone)",    act: 2, startSec: 262,  endSec: 295,  steps: 3 },

  // Para 5 (4:55–6:40) — terminal startup → side-by-side streaming → resources → 100× rapid
  // (cross-eval and cross-track scenes removed; Daniel narrates over the dispatch flow only)
  { id: "easter5Dispatch",        label: "Easter · terminal + phone + timelapse", act: 2, startSec: 295, endSec: 400, steps: 2 },

  // Para 6 (6:40–7:30)
  { id: "easter8Reveal",          label: "Easter · the paper · 16 pages",  act: 2, startSec: 400,  endSec: 450,  steps: 3 },

  // Para 7 (7:30–8:54)
  { id: "easter9Thesis",          label: "Easter · meta-thesis",           act: 2, startSec: 450,  endSec: 470,  steps: 2 },

  // Para 7 (capability staircase) — still "today", stays dark
  { id: "act3Preamble",           label: "Capability staircase · today",   act: 2, startSec: 470,  endSec: 526,  steps: 1 },

  // Para 8 (8:54–9:55) — last beat of the Easter reflection
  { id: "easter10WhyPossible",    label: "Why this was possible",          act: 2, startSec: 526,  endSec: 587,  steps: 2 },

  // Para 9 (9:55–11:15) — physics × AI papers, still dark / "today"
  { id: "statsFeint",             label: "Physics × AI · paper count",     act: 2, startSec: 587,  endSec: 667,  steps: 4 },

  // Single dark→light transition: lands AFTER the today-anchored scenes.
  { id: "calendarFlip",           label: "Calendar flip · 2026 → 2028",    act: 3, startSec: 667,  endSec: 675,  steps: 1 },

  // Para 10 (11:15–13:15) — first scene in light mode
  { id: "scienceDashToday",       label: "ScienceDash · today",            act: 3, startSec: 675,  endSec: 795,  steps: 6 },

  // Outer-loop reveal — sets up Paras 11-14 (collaborate / teach / publish)
  { id: "loopsVizOuter",          label: "Outer loop · all three",         act: 3, startSec: 795,  endSec: 810,  steps: 3 },

  // Para 11 (13:15–15:35)
  { id: "nbiGraph",               label: "NBI graph + roulette",           act: 3, startSec: 810,  endSec: 880,  steps: 3 },
  { id: "matchmaking",            label: "Live matchmaking",               act: 3, startSec: 880,  endSec: 950,  steps: 2 },

  // Para 12 (15:35–17:11)
  // Teaching scene now absorbs the reverse-lecture evidence cards (Harvard /
  // Stanford / CMU + 2× headline). Steps: question centred → phone reveal →
  // during-class cards → evidence cards.
  { id: "faculty2031Teaching",    label: "Faculty 2028 · teaching",        act: 3, startSec: 950,  endSec: 1046, steps: 4 },

  // Para 13 (17:11–18:12)
  { id: "phdPedagogy",            label: "PhD pedagogy · open question",   act: 3, startSec: 1046, endSec: 1107, steps: 4 },

  // Para 14 (18:12–19:30)
  { id: "nbiAINativeCallToAction",label: "NBI · AI-native call to action", act: 4, startSec: 1107, endSec: 1167, steps: 6 },
  { id: "claudeFinalSlide",       label: "Claude's final slide",           act: 4, startSec: 1167, endSec: 1185, steps: 2 },
];

export const TOTAL_SEC = 1185;

export function formatMMSS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
