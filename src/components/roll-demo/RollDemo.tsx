"use client";

import { useEffect, useState } from "react";
import { RollVariant } from "./RollVariant";
import { VARIANTS, type VariantId } from "./variants";

type Selected = "grid" | VariantId;

const PRESETS = [0, 0.25, 0.5, 0.75, 1.0];

export function RollDemo() {
  const [progress, setProgress] = useState(0.5);
  const [selected, setSelected] = useState<Selected>("grid");
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  return (
    <div
      data-roll-demo-ready={ready ? "true" : "false"}
      className="min-h-screen bg-[#050607] text-zinc-200 font-mono text-sm"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#050607]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-[11px] uppercase tracking-wider">progress</span>
          <input
            id="roll-progress"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="flex-1 accent-sky-400"
          />
          <span className="text-zinc-200 tabular-nums w-14 text-right">{progress.toFixed(3)}</span>
          <div className="flex items-center gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setProgress(p)}
                className={`px-2 py-1 rounded text-[11px] border border-white/10 hover:bg-white/10 ${
                  Math.abs(progress - p) < 0.005 ? "bg-white/15 text-white" : "text-zinc-400"
                }`}
              >
                {p.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500 text-[11px] uppercase tracking-wider mr-2">variant</span>
          <button
            data-variant-select="grid"
            onClick={() => setSelected("grid")}
            className={`px-3 py-1.5 rounded border border-white/10 text-[12px] hover:bg-white/10 ${
              selected === "grid" ? "bg-white/15 text-white" : "text-zinc-400"
            }`}
          >
            grid (all 6)
          </button>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              data-variant-select={v.id}
              onClick={() => setSelected(v.id)}
              className={`px-3 py-1.5 rounded border border-white/10 text-[12px] hover:bg-white/10 ${
                selected === v.id ? "bg-white/15 text-white" : "text-zinc-400"
              }`}
              title={v.notes}
            >
              {v.id}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {selected === "grid" ? (
          <div className="grid grid-cols-3 gap-6">
            {VARIANTS.map((v) => (
              <div key={v.id} data-variant={v.id} className="flex flex-col gap-2">
                <div className="rounded border border-white/10 overflow-hidden">
                  <RollVariant config={v} progress={progress} width={480} height={300} />
                </div>
                <div>
                  <div className="text-zinc-200">{v.label}</div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">{v.notes}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SingleView id={selected} progress={progress} />
        )}
      </div>
    </div>
  );
}

function SingleView({ id, progress }: { id: VariantId; progress: number }) {
  const v = VARIANTS.find((x) => x.id === id)!;
  return (
    <div className="flex gap-6 items-start">
      <div data-variant={v.id} className="rounded border border-white/10 overflow-hidden">
        <RollVariant config={v} progress={progress} width={1000} height={625} />
      </div>
      <div className="flex flex-col gap-2 text-[12px] w-64">
        <div className="text-white text-[14px]">{v.label}</div>
        <div className="text-zinc-400">{v.notes}</div>
        <div className="mt-4 border-t border-white/10 pt-3 text-zinc-500 text-[11px] space-y-1">
          <Param k="R" v={v.R} />
          <Param k="camera" v={`[${v.cameraPos.join(", ")}]`} />
          <Param k="lookAt" v={`[${v.cameraLookAt.join(", ")}]`} />
          <Param k="fov" v={v.fov} />
          <Param k="subdiv" v={`${v.subdivisions[0]}×${v.subdivisions[1]}`} />
          <Param k="texture" v={v.texture} />
          <Param k="shading" v={v.shading} />
        </div>
      </div>
    </div>
  );
}

function Param({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-600">{k}</span>
      <span className="text-zinc-300 tabular-nums">{String(v)}</span>
    </div>
  );
}
