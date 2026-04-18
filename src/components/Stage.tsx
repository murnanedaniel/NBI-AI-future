"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { SCENES } from "@/lib/timeline";
import { useKeyboard } from "@/lib/useKeyboard";
import { useElapsed } from "@/lib/useElapsed";
import { PresenterClock } from "./PresenterClock";
import { TitleSlide } from "./scenes/TitleSlide";
import { HLLHCHook } from "./scenes/HLLHCHook";
import { PlaceholderScene } from "./scenes/PlaceholderScene";

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
    switch (scene.id) {
      case "title":
        return <TitleSlide key="title" />;
      case "hllhc":
        return <HLLHCHook key="hllhc" />;
      default:
        return <PlaceholderScene key={scene.id} id={scene.id} label={scene.label} act={scene.act} />;
    }
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
