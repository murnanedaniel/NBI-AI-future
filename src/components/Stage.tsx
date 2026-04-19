"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SCENES, type SceneId } from "@/lib/timeline";
import { useKeyboard } from "@/lib/useKeyboard";
import { useElapsed } from "@/lib/useElapsed";
import { PresenterClock } from "./PresenterClock";
import { TitleSlide } from "./scenes/TitleSlide";
import { RateRamp } from "./scenes/RateRamp";
import { TrackingProblem } from "./scenes/TrackingProblem";
import { GnnSolution } from "./scenes/GnnSolution";
import { SpeedJourney } from "./scenes/SpeedJourney";
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

type SceneComponent = (props: { step: number }) => React.ReactElement;

const SCENE_COMPONENTS: Partial<Record<SceneId, SceneComponent>> = {
  title: TitleSlide,
  rateRamp: RateRamp,
  trackingProblem: TrackingProblem,
  gnnSolution: GnnSolution,
  speedJourney: SpeedJourney,
  easter1Release: EasterRelease as unknown as SceneComponent,
  easter2Bug: EasterBug as unknown as SceneComponent,
  easter3SmokingGun: EasterSmokingGun as unknown as SceneComponent,
  easter4CrossEval: EasterCrossEval as unknown as SceneComponent,
  easter5Dispatch: EasterDispatch as unknown as SceneComponent,
  easter6Architecture: EasterArchitecture as unknown as SceneComponent,
  easter7Discovery: EasterDiscovery as unknown as SceneComponent,
  easter8Reveal: EasterReveal as unknown as SceneComponent,
  easter9Thesis: EasterThesis as unknown as SceneComponent,
  easter10WhyPossible: EasterWhyPossible as unknown as SceneComponent,
  statsFeint: StatsFeint as unknown as SceneComponent,
  matchmaking: Matchmaking as unknown as SceneComponent,
  act3Preamble: Act3Preamble as unknown as SceneComponent,
  faculty2031Morning: Faculty2031Morning as unknown as SceneComponent,
  faculty2031Teaching: Faculty2031Teaching as unknown as SceneComponent,
};

export function Stage() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [clockVisible, setClockVisible] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [running, setRunning] = useState(false);

  const { elapsed, reset } = useElapsed(running);

  const scene = SCENES[sceneIdx];
  const theme = scene.theme ?? "dark";

  const advance = useCallback(() => {
    setRunning(true);
    const current = SCENES[sceneIdx];
    if (stepIdx < current.steps - 1) {
      setStepIdx(stepIdx + 1);
      return;
    }
    if (sceneIdx < SCENES.length - 1) {
      setSceneIdx(sceneIdx + 1);
      setStepIdx(0);
    }
  }, [sceneIdx, stepIdx]);

  const rewind = useCallback(() => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
      return;
    }
    if (sceneIdx > 0) {
      const prev = SCENES[sceneIdx - 1];
      setSceneIdx(sceneIdx - 1);
      setStepIdx(Math.max(0, prev.steps - 1));
    }
  }, [sceneIdx, stepIdx]);

  const restart = useCallback(() => {
    setSceneIdx(0);
    setStepIdx(0);
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
    if (Comp) return <Comp key={scene.id} step={stepIdx} />;
    return <PlaceholderScene key={scene.id} id={scene.id} label={scene.label} act={scene.act} />;
  }, [scene, stepIdx]);

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
          sceneIdx={sceneIdx}
          stepIdx={stepIdx}
          total={SCENES.length}
          fallback={fallback}
          running={running}
        />
      )}
    </motion.div>
  );
}
