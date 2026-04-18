export type SceneId =
  | "title"
  | "hllhc"
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
  | "undergrad2031"
  | "phd2031"
  | "faculty2031"
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
  theme?: Theme;
};

export const SCENES: Scene[] = [
  { id: "title",               label: "Title",                       act: 1, startSec: 0,    endSec: 60   },
  { id: "hllhc",               label: "HL-LHC tracking hook",        act: 1, startSec: 60,   endSec: 120  },

  { id: "easter1Release",      label: "Easter · release",            act: 2, startSec: 120,  endSec: 140  },
  { id: "easter2Bug",          label: "Easter · bug report",         act: 2, startSec: 140,  endSec: 175  },
  { id: "easter3SmokingGun",   label: "Easter · predict zero",       act: 2, startSec: 175,  endSec: 230  },
  { id: "easter4CrossEval",    label: "Easter · cross-eval",         act: 2, startSec: 230,  endSec: 265  },
  { id: "easter5Dispatch",     label: "Easter · dispatch",           act: 2, startSec: 265,  endSec: 305  },
  { id: "easter6Architecture", label: "Easter · cross-track attn",   act: 2, startSec: 305,  endSec: 345  },
  { id: "easter7Discovery",    label: "Easter · vertex discovery",   act: 2, startSec: 345,  endSec: 410  },
  { id: "easter8Reveal",       label: "Easter · reveal",             act: 2, startSec: 410,  endSec: 450  },
  { id: "easter9Thesis",       label: "Easter · meta-thesis",        act: 2, startSec: 450,  endSec: 480  },
  { id: "easter10WhyPossible", label: "Easter · why possible",       act: 2, startSec: 480,  endSec: 510  },

  { id: "statsFeint",          label: "Stats feint → collapse",      act: 3, startSec: 510,  endSec: 540  },
  { id: "matchmaking",         label: "Live matchmaking",            act: 3, startSec: 540,  endSec: 660, theme: "light" },
  { id: "undergrad2031",       label: "Undergrad 2031",              act: 3, startSec: 660,  endSec: 800, theme: "light" },
  { id: "phd2031",             label: "PhD 2031",                    act: 3, startSec: 800,  endSec: 900, theme: "light" },
  { id: "faculty2031",         label: "Faculty 2031",                act: 3, startSec: 900,  endSec: 960, theme: "light" },
  { id: "wordcloud",           label: "Audience word cloud",         act: 3, startSec: 960,  endSec: 990, theme: "light" },
  { id: "mondayMorning",       label: "Monday morning: 3 bets",      act: 4, startSec: 990,  endSec: 1140, theme: "light" },
  { id: "close",               label: "Close",                       act: 4, startSec: 1140, endSec: 1200, theme: "light" },
];

export const TOTAL_SEC = 1200;

export function formatMMSS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
