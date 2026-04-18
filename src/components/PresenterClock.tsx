"use client";

import { SCENES, TOTAL_SEC, formatMMSS } from "@/lib/timeline";

type Props = {
  elapsed: number;
  sceneIdx: number;
  total: number;
  fallback: boolean;
  running: boolean;
};

export function PresenterClock({ elapsed, sceneIdx, fallback, running }: Props) {
  const scene = SCENES[sceneIdx];
  const expectedElapsed = scene.startSec;
  const drift = elapsed - expectedElapsed;
  const driftColor =
    Math.abs(drift) < 15 ? "text-zinc-400" : drift > 0 ? "text-amber-400" : "text-sky-300";
  const remaining = TOTAL_SEC - elapsed;

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-[11px] leading-tight bg-black/60 backdrop-blur border border-white/10 rounded px-3 py-2 text-zinc-300 select-none">
      <div className="flex items-center gap-3">
        <span className={running ? "text-emerald-400" : "text-zinc-500"}>
          {running ? "● LIVE" : "○ IDLE"}
        </span>
        <span>{formatMMSS(elapsed)} / {formatMMSS(TOTAL_SEC)}</span>
        <span className="text-zinc-500">·</span>
        <span>left {formatMMSS(remaining)}</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-zinc-500">act {scene.act}</span>
        <span className="text-zinc-200">{scene.label}</span>
        <span className="text-zinc-600">[{sceneIdx + 1}/{SCENES.length}]</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-zinc-500">budget</span>
        <span>{formatMMSS(scene.startSec)}–{formatMMSS(scene.endSec)}</span>
        <span className={driftColor}>
          {drift >= 0 ? "+" : ""}{formatMMSS(Math.abs(drift))}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-zinc-600">
        space/→ advance · ←/⇞ back · P clock · F fallback{fallback ? " ON" : ""} · R restart
      </div>
    </div>
  );
}
