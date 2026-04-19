"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const W = 1000;
const H = 620;
const CX = W / 2;
const CY = H / 2;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHits(count: number) {
  const r = seeded(7);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(r() * 9);
    const radius = 30 + layer * 28 + (r() - 0.5) * 12;
    const phi = r() * Math.PI * 2;
    const x = CX + Math.cos(phi) * radius;
    const y = CY + Math.sin(phi) * radius * 0.82;
    pts.push({ x, y });
  }
  return pts;
}

function generateTracks(count: number) {
  const r = seeded(13);
  const tracks: { path: string; color: string; pT: number }[] = [];
  for (let i = 0; i < count; i++) {
    const phi = r() * Math.PI * 2;
    const pT = 0.3 + r() * r() * 4;
    const curv = (r() < 0.5 ? -1 : 1) * (0.0009 / Math.max(0.3, pT));
    const steps = 26;
    const maxR = 260;
    let pathStr = `M ${CX},${CY}`;
    for (let s = 1; s <= steps; s++) {
      const t = (s / steps) * maxR;
      const bend = curv * t * t;
      const x = CX + Math.cos(phi + bend) * t;
      const y = CY + Math.sin(phi + bend) * t * 0.82;
      pathStr += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    const shade = 0.35 + Math.min(1, pT * 0.28);
    tracks.push({
      path: pathStr,
      color: `hsla(${198 + r() * 40}, 85%, ${55 + shade * 10}%, ${shade * 0.95})`,
      pT,
    });
  }
  return tracks;
}

export function TrackingProblem({ step }: { step: number }) {
  const hits = useMemo(() => generateHits(900), []);
  const fewTracks = useMemo(() => generateTracks(12), []);
  const manyTracks = useMemo(() => generateTracks(140), []);

  return (
    <motion.div
      className="absolute inset-0 canvas-grid vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · the tracking problem</div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 text-right">
            <div>ATLAS ITk · ⟨μ⟩ ≈ 200</div>
            <div>~300k hits · ~2k tracks</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[1100px] h-auto">
            <circle cx={CX} cy={CY} r={4} fill="#7dd3fc" fillOpacity="0.8" />
            {hits.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={1.2}
                fill="#7dd3fc"
                fillOpacity={0.42}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.6, delay: (i % 60) * 0.006 } }}
              />
            ))}

            {step >= 1 && fewTracks.map((t, i) => (
              <motion.path
                key={`f${i}`}
                d={t.path}
                fill="none"
                stroke={t.color}
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 0.85, delay: 0.1 + i * 0.07, ease: [0.3, 0, 0.2, 1] },
                }}
              />
            ))}

            {step >= 2 && manyTracks.map((t, i) => (
              <motion.path
                key={`m${i}`}
                d={t.path}
                fill="none"
                stroke={t.color}
                strokeWidth="0.9"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 0.65,
                  transition: { duration: 0.6, delay: (i % 40) * 0.018, ease: [0.3, 0, 0.2, 1] },
                }}
              />
            ))}
          </svg>
        </div>

        <div className="max-w-2xl">
          {step >= 0 && step < 1 && (
            <motion.p
              className="font-serif italic text-zinc-400 text-[clamp(16px,1.35vw,22px)] leading-snug"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6 } }}
            >
              every dot is a hit in the detector.
            </motion.p>
          )}
          {step >= 1 && step < 2 && (
            <motion.p
              className="font-serif italic text-zinc-300 text-[clamp(16px,1.35vw,22px)] leading-snug"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6 } }}
            >
              each particle leaves a curve through ten of them.
            </motion.p>
          )}
          {step >= 2 && (
            <motion.p
              className="font-serif italic text-zinc-200 text-[clamp(16px,1.35vw,22px)] leading-snug"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6 } }}
            >
              two thousand curves, sharing three hundred thousand dots.<br />
              <span className="text-zinc-400">find them all. forty million times a second.</span>
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
