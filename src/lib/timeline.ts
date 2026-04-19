export type SceneId =
  | "title"
  | "rateRamp"
  | "trackingProblem"
  | "gnnSolution"
  | "speedJourney"
  | "aiForAi"
  | "easter1Release"
  | "easter2Bug"
  | "easter3SmokingGun"
  | "easter4CrossEval"
  | "easter5Dispatch"
  | "easter6Architecture"
  | "easter7Discovery"
  | "easter8Reveal"
  | "easter9Thesis"
  | "easter10WhyPossible"
  | "statsFeint"
  | "matchmaking"
  | "act3Preamble"
  | "faculty2031Morning"
  | "faculty2031Teaching"
  | "wordcloud"
  | "mondayMorning"
  | "close";

export type Theme = "dark" | "light";

export type Scene = {
  id: SceneId;
  label: string;
  act: 1 | 2 | 3 | 4;
  startSec: number;
  endSec: number;
  steps: number;
  theme?: Theme;
};

export const SCENES: Scene[] = [
  { id: "title",               label: "Title",                       act: 1, startSec: 0,    endSec: 60,   steps: 3 },
  { id: "rateRamp",            label: "40 million per second",       act: 1, startSec: 60,   endSec: 75,   steps: 4 },
  { id: "trackingProblem",     label: "Find tracks in hits",         act: 1, startSec: 75,   endSec: 90,   steps: 3 },
  { id: "gnnSolution",         label: "Graphs, not transformers",    act: 1, startSec: 90,   endSec: 105,  steps: 4 },
  { id: "speedJourney",        label: "From 30 s to 10 ms",          act: 1, startSec: 105, endSec: 120,  steps: 3 },

  { id: "aiForAi",             label: "Not AI for science",          act: 2, startSec: 120, endSec: 130,  steps: 2 },

  { id: "easter1Release",      label: "Easter · release",            act: 2, startSec: 130, endSec: 150,  steps: 1 },
  { id: "easter2Bug",          label: "Easter · bug report",         act: 2, startSec: 150, endSec: 185,  steps: 1 },
  { id: "easter3SmokingGun",   label: "Easter · predict zero",       act: 2, startSec: 185, endSec: 240,  steps: 1 },
  { id: "easter4CrossEval",    label: "Easter · cross-eval",         act: 2, startSec: 240, endSec: 275,  steps: 1 },
  { id: "easter5Dispatch",     label: "Easter · dispatch",           act: 2, startSec: 275, endSec: 315,  steps: 1 },
  { id: "easter6Architecture", label: "Easter · cross-track attn",   act: 2, startSec: 315, endSec: 355,  steps: 1 },
  { id: "easter7Discovery",    label: "Easter · vertex discovery",   act: 2, startSec: 355, endSec: 420,  steps: 1 },
  { id: "easter8Reveal",       label: "Easter · reveal",             act: 2, startSec: 420, endSec: 460,  steps: 1 },
  { id: "easter9Thesis",       label: "Easter · meta-thesis",        act: 2, startSec: 460, endSec: 490,  steps: 1 },
  { id: "easter10WhyPossible", label: "Easter · why possible",       act: 2, startSec: 490, endSec: 520,  steps: 1 },

  { id: "statsFeint",          label: "Stats feint → collapse",      act: 3, startSec: 520, endSec: 550,  steps: 1 },
  { id: "matchmaking",         label: "Live matchmaking",            act: 3, startSec: 550, endSec: 660,  steps: 1, theme: "light" },
  { id: "act3Preamble",        label: "Capability staircase",        act: 3, startSec: 660, endSec: 700,  steps: 1, theme: "light" },
  { id: "faculty2031Morning",  label: "Faculty 2027 · morning",      act: 3, startSec: 700, endSec: 820,  steps: 1, theme: "light" },
  { id: "faculty2031Teaching", label: "Faculty 2027 · teaching",     act: 3, startSec: 820, endSec: 940,  steps: 1, theme: "light" },

  { id: "wordcloud",           label: "Audience word cloud",         act: 3, startSec: 940, endSec: 970,  steps: 1, theme: "light" },
  { id: "mondayMorning",       label: "Monday morning: 3 bets",      act: 4, startSec: 970, endSec: 1140, steps: 1, theme: "light" },
  { id: "close",               label: "Close",                       act: 4, startSec: 1140, endSec: 1200, steps: 1, theme: "light" },
];

export const TOTAL_SEC = 1200;

export function formatMMSS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
