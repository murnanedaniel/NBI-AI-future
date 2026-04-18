export type SceneId =
  | "title"
  | "hllhc"
  | "easter"
  | "hinge"
  | "undergrad2031"
  | "phd2031"
  | "faculty2031"
  | "wordcloud"
  | "mondayMorning"
  | "close";

export type Scene = {
  id: SceneId;
  label: string;
  act: 1 | 2 | 3 | 4;
  startSec: number;
  endSec: number;
};

export const SCENES: Scene[] = [
  { id: "title",          label: "Title",                  act: 1, startSec: 0,    endSec: 60   },
  { id: "hllhc",          label: "HL-LHC tracking hook",   act: 1, startSec: 60,   endSec: 120  },
  { id: "easter",         label: "Easter beamspot story",  act: 2, startSec: 120,  endSec: 480  },
  { id: "hinge",          label: "Live Claude + Q",        act: 2, startSec: 480,  endSec: 540  },
  { id: "undergrad2031",  label: "Undergrad 2031",         act: 3, startSec: 540,  endSec: 720  },
  { id: "phd2031",        label: "PhD 2031",               act: 3, startSec: 720,  endSec: 840  },
  { id: "faculty2031",    label: "Faculty 2031",           act: 3, startSec: 840,  endSec: 900  },
  { id: "wordcloud",      label: "Audience word cloud",    act: 3, startSec: 900,  endSec: 930  },
  { id: "mondayMorning",  label: "Monday morning: 3 bets", act: 4, startSec: 930,  endSec: 1140 },
  { id: "close",          label: "Close",                  act: 4, startSec: 1140, endSec: 1200 },
];

export const TOTAL_SEC = 1200;

export function formatMMSS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
