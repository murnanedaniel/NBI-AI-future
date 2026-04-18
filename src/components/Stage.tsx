"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
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
};

export function Stage() {
  const [idx, setIdx] = useState(0);
  const [clockVisible, setClockVisible] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [running, setRunning] = useState(false);

  const { elapsed, reset } = useElapsed(running);

  const scene = SCENES[idx];

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
    <div
      className="relative w-screen h-screen overflow-hidden bg-canvas cursor-pointer select-none"
      onClick={advance}
      role="button"
      tabIndex={0}
    >
      <AnimatePresence mode="wait">{rendered}</AnimatePresence>

      <button
        type="button"
        aria-label="Restart from the beginning"
        onClick={(e) => {
          e.stopPropagation();
          restart();
        }}
        className="fixed top-4 right-4 z-50 h-9 px-3 flex items-center gap-1.5 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/90 backdrop-blur border border-white/10 text-[11px] font-mono text-zinc-300 transition"
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
    </div>
  );
}
