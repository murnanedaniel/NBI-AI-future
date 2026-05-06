"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

// Beamspot drift visualization — small inset showing how the LHC luminous
// region wanders by hundreds of microns from month to month, while training
// data has it pinned at the origin.
function BeamspotDrift() {
  // 8 month positions: training data (origin) vs reality (drifting)
  const trainingPositions = Array.from({ length: 24 }, () => ({
    x: (Math.random() - 0.5) * 8, // tight cluster σ ≈ 4 μm
    y: (Math.random() - 0.5) * 8,
    color: "fill-emerald-400/70",
  }));
  const realPositions = [
    [-180, 110], [-90, 150], [40, 130], [120, 80],
    [180, -10], [120, -110], [-30, -150], [-160, -80],
  ].map(([x, y]) => ({ x, y, color: "fill-rose-400/85" }));

  return (
    <div className="grid grid-cols-2 gap-6 max-w-[640px] mx-auto">
      <div>
        <div className="font-mono text-[10px] text-emerald-300/80 uppercase tracking-wider mb-2">
          training data · σ ≈ 4 μm
        </div>
        <svg viewBox="-220 -220 440 440" className="w-full aspect-square bg-zinc-900/40 rounded">
          <line x1="-220" y1="0" x2="220" y2="0" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="-220" x2="0" y2="220" stroke="rgba(255,255,255,0.08)" />
          {trainingPositions.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" className={p.color} />
          ))}
        </svg>
        <div className="text-center mt-2 font-mono text-[10px] text-zinc-500">
          collisions cluster at the origin
        </div>
      </div>
      <div>
        <div className="font-mono text-[10px] text-rose-300/80 uppercase tracking-wider mb-2">
          reality · drifts ~200 μm / month
        </div>
        <svg viewBox="-220 -220 440 440" className="w-full aspect-square bg-zinc-900/40 rounded">
          <line x1="-220" y1="0" x2="220" y2="0" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="-220" x2="0" y2="220" stroke="rgba(255,255,255,0.08)" />
          {realPositions.map((p, i) => (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={realPositions[i - 1].x}
                  y1={realPositions[i - 1].y}
                  x2={p.x}
                  y2={p.y}
                  stroke="rgba(244,114,114,0.25)"
                  strokeWidth="1"
                />
              )}
              <circle cx={p.x} cy={p.y} r="5" className={p.color} />
              <text x={p.x + 8} y={p.y + 4} fontSize="9" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">
                {`m${i + 1}`}
              </text>
            </g>
          ))}
        </svg>
        <div className="text-center mt-2 font-mono text-[10px] text-zinc-500">
          beamspot wanders month to month
        </div>
      </div>
    </div>
  );
}

export function EasterBug(_props: { step: number }) {
  return (
    <EasterShell
      beat={2}
      headline="&ldquo;I think there&rsquo;s a bug.&rdquo;"
    >
      <motion.div
        className="bg-zinc-900/70 border border-white/10 rounded-md font-mono text-[clamp(13px,1.05vw,16px)] text-zinc-200 leading-relaxed shadow-2xl w-full max-w-[1280px]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
      >
        {/* Email header */}
        <div className="px-7 py-4 border-b border-white/10 text-[12px]">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
            <span>colliderml · github discussion</span>
            <span className="ml-auto text-zinc-600">Apr 4, 2026 · 10:42 CEST</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1 text-zinc-400">
            <div className="text-zinc-500">From:</div><div className="text-zinc-200">a colleague</div>
            <div className="text-zinc-500">To:</div><div>Daniel</div>
            <div className="text-zinc-500">Subject:</div><div className="text-zinc-100">d0 precision on ColliderML — too good?</div>
          </div>
        </div>

        {/* Body — paraphrased / scrambled. Keeps the technical core: the
            ML reaches a d0 precision that beats the classical baseline,
            and they suspect the beamspot is the culprit. */}
        <div className="px-7 py-6 space-y-4 text-zinc-300">
          <p>Hi Daniel,</p>
          <p>
            We&rsquo;ve been training an ML model on the ColliderML tracker hits. The d0 precision
            is good — <em>very</em> good. About a factor of two better than the classical method.
          </p>
          <p>
            We suspect the network has learned that the beamspot in your simulation sits at
            <span className="text-amber-300"> (0, 0, 0)</span> and is just predicting that, while the
            classical method cannot exploit a fixed beamspot. The d0 numbers look unrealistic.
          </p>
          <p>A few questions for sanity:</p>
          <ul className="list-disc pl-7 space-y-1.5 text-zinc-300">
            <li>Where is the primary beam spot in your generation, and how is it smeared?</li>
            <li>What is the beam-spot size in (x, y, z)?</li>
            <li>Is the beam axis tilted, like at the LHC?</li>
          </ul>
          <p className="text-zinc-400">Thanks!</p>
        </div>

        <div className="px-7 py-3 border-t border-white/10 text-zinc-500 text-[11px]">
          + 2 similar reports in the last week
        </div>
      </motion.div>
    </EasterShell>
  );
}
