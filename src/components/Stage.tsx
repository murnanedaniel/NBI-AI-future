"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SCENES, type SceneId } from "@/lib/timeline";
import { useKeyboard } from "@/lib/useKeyboard";
import { useElapsed } from "@/lib/useElapsed";
import { PresenterClock } from "./PresenterClock";
import { TitleSlide } from "./scenes/TitleSlide";
import { HLLHCHook } from "./scenes/HLLHCHook";
import { PlaceholderScene } from "./scenes/PlaceholderScene";
import { EasterRelease } from "./scenes/EasterRelease";
import { EasterBug } from "./scenes/EasterBug";
import { EasterSmokingGun } from "./scenes/EasterSmokingGun";
import { EasterCrossEval } from "./scenes/EasterCrossEval";
import { EasterDispatch } from "./scenes/EasterDispatch";
import { EasterArchitecture } from "./scenes/EasterArchitecture";
import { EasterDiscovery } from "./scenes/EasterDiscovery";
import { EasterReveal } from "./scenes/EasterReveal";
import { EasterThesis } from "./scenes/EasterThesis";
import { EasterWhyPossible } from "./scenes/EasterWhyPossible";
import { StatsFeint } from "./scenes/StatsFeint";
import { Matchmaking } from "./scenes/Matchmaking";
import { Act3Preamble } from "./scenes/Act3Preamble";
import { Faculty2031Morning } from "./scenes/Faculty2031Morning";
import { Faculty2031Teaching } from "./scenes/Faculty2031Teaching";

const SCENE_COMPONENTS: Partial<Record<SceneId, () => React.ReactElement>> = {
  title: TitleSlide,
  hllhc: HLLHCHook,
  easter1Release: EasterRelease,
  easter2Bug: EasterBug,
  easter3SmokingGun: EasterSmokingGun,
  easter4CrossEval: EasterCrossEval,
  easter5Dispatch: EasterDispatch,
  easter6Architecture: EasterArchitecture,
  easter7Discovery: EasterDiscovery,
  easter8Reveal: EasterReveal,
  easter9Thesis: EasterThesis,
  easter10WhyPossible: EasterWhyPossible,
  statsFeint: StatsFeint,
  matchmaking: Matchmaking,
  act3Preamble: Act3Preamble,
  faculty2031Morning: Faculty2031Morning,
  faculty2031Teaching: Faculty2031Teaching,
};

export function Stage() {
  const [idx, setIdx] = useState(0);
  const [clockVisible, setClockVisible] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [running, setRunning] = useState(false);

  const { elapsed, reset } = useElapsed(running);

  const scene = SCENES[idx];
  const theme = scene.theme ?? "dark";

  const advance = useCallback(() => {
    setRunning(true);
    setIdx((i) => Math.min(i + 1, SCENES.length - 1));
  }, []);
  const rewind = useCallback(() => {
    setIdx((i) => Math.max(i - 1, 0));
  }, []);
  const restart = useCallback(() => {
    setIdx(0);
    setRunning(false);
    reset();
  }, [reset]);

  useKeyboard({
    onAdvance: advance,
    onRewind: rewind,
    onToggleClock: () => setClockVisible((v) => !v),
    onToggleFallback: () => setFallback((v) => !v),
    onRestart: restart,
  });

  const rendered = useMemo(() => {
    const Comp = SCENE_COMPONENTS[scene.id];
    if (Comp) return <Comp key={scene.id} />;
    return <PlaceholderScene key={scene.id} id={scene.id} label={scene.label} act={scene.act} />;
  }, [scene]);

  return (
    <motion.div
      className={`relative w-screen h-screen overflow-hidden cursor-pointer select-none ${theme === "light" ? "theme-light" : ""}`}
      onClick={advance}
      role="button"
      tabIndex={0}
      animate={{ backgroundColor: theme === "light" ? "#f6f1e7" : "#050607" }}
      transition={{ duration: 1.2, ease: [0.65, 0, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">{rendered}</AnimatePresence>

      <button
        type="button"
        aria-label="Restart from the beginning"
        onClick={(e) => {
          e.stopPropagation();
          restart();
        }}
        className={`fixed top-4 right-4 z-50 h-9 px-3 flex items-center gap-1.5 rounded-full backdrop-blur border text-[11px] font-mono transition ${
          theme === "light"
            ? "bg-white/60 hover:bg-white/80 border-ink/10 text-ink/70"
            : "bg-black/50 hover:bg-black/70 border-white/10 text-zinc-300"
        }`}
      >
        <span className="text-sm leading-none">↺</span>
        <span>reset</span>
      </button>

      {clockVisible && (
        <PresenterClock
          elapsed={elapsed}
          sceneIdx={idx}
          total={SCENES.length}
          fallback={fallback}
          running={running}
        />
      )}
    </motion.div>
  );
}
