"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const W = 1000;
const H = 560;
const CX = W / 2;
const CY = H / 2;
const NODE_COUNT = 48;
const EDGE_DISTANCE = 110;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

type Node = { id: number; x: number; y: number; trackId: number };
type Edge = { from: number; to: number; good: boolean };

function generateGraph() {
  const rand = seeded(23);
  const nodes: Node[] = [];

  const trackCount = 6;
  const trackPhis = Array.from({ length: trackCount }, (_, i) => (i / trackCount) * Math.PI * 2 + rand() * 0.3);

  for (let t = 0; t < trackCount; t++) {
    const phi = trackPhis[t];
    const curv = (rand() - 0.5) * 0.0015;
    for (let s = 1; s <= 7; s++) {
      const r = 34 + s * 30;
      const bend = curv * r * r;
      nodes.push({
        id: nodes.length,
        x: CX + Math.cos(phi + bend) * r,
        y: CY + Math.sin(phi + bend) * r * 0.78,
        trackId: t,
      });
    }
  }

  while (nodes.length < NODE_COUNT) {
    nodes.push({
      id: nodes.length,
      x: CX + (rand() - 0.5) * 620,
      y: CY + (rand() - 0.5) * 440,
      trackId: -1,
    });
  }

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.hypot(dx, dy);
      if (d < EDGE_DISTANCE) {
        const sameTrack = nodes[i].trackId >= 0 && nodes[i].trackId === nodes[j].trackId;
        const adjacent = sameTrack && Math.abs(i - j) <= 2;
        edges.push({ from: i, to: j, good: adjacent });
      }
    }
  }

  return { nodes, edges };
}

const TRACK_COLORS = ["#7dd3fc", "#f59e0b", "#a78bfa", "#34d399", "#f472b6", "#facc15"];

export function GnnSolution({ step }: { step: number }) {
  const { nodes, edges } = useMemo(generateGraph, []);

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
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · the method</div>
            <div className="mt-2 font-serif italic text-zinc-100 text-[clamp(24px,2.6vw,40px)] leading-tight">
              treat the hits as a graph.
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 text-right">
            <div>GNN4ITk · ACORN</div>
            <div>graph build → edge class → segment</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[1100px] h-auto">
            {step >= 1 && edges.map((e, i) => {
              const n1 = nodes[e.from];
              const n2 = nodes[e.to];
              const keep = step >= 3 ? e.good : true;
              const pulseOn = step === 2;
              return (
                <motion.line
                  key={`edge-${i}`}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke={keep ? (step >= 3 && e.good ? TRACK_COLORS[n1.trackId % TRACK_COLORS.length] : "#a1a1aa") : "#71717a"}
                  strokeOpacity={keep ? (step >= 3 && e.good ? 0.9 : 0.35) : 0.08}
                  strokeWidth={keep && step >= 3 && e.good ? 1.6 : 0.8}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: pulseOn ? [0.2, 1, 0.2] : keep ? (step >= 3 && e.good ? 0.9 : 0.35) : 0.08,
                    transition: pulseOn
                      ? { duration: 1.6, delay: (i % 20) * 0.06, repeat: Infinity, repeatType: "loop" }
                      : { duration: 0.6, delay: (i % 20) * 0.02 },
                  }}
                />
              );
            })}

            {nodes.map((n, i) => {
              const isOnTrack = n.trackId >= 0;
              const final = step >= 3 && isOnTrack;
              return (
                <motion.circle
                  key={`n-${i}`}
                  cx={n.x}
                  cy={n.y}
                  r={final ? 4.6 : 3.4}
                  fill={final ? TRACK_COLORS[n.trackId % TRACK_COLORS.length] : "#e4e4e7"}
                  fillOpacity={final ? 0.95 : 0.85}
                  stroke={final ? TRACK_COLORS[n.trackId % TRACK_COLORS.length] : "#7dd3fc"}
                  strokeOpacity={0.55}
                  strokeWidth="0.8"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.4, delay: (i % 15) * 0.02 },
                  }}
                />
              );
            })}
          </svg>
        </div>

        <div className="max-w-2xl">
          {step === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-400 text-[clamp(15px,1.25vw,20px)]">
              hits become nodes.
            </motion.p>
          )}
          {step === 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-300 text-[clamp(15px,1.25vw,20px)]">
              nearby nodes become edges. most are wrong.
            </motion.p>
          )}
          {step === 2 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-200 text-[clamp(15px,1.25vw,20px)]">
              a neural network passes messages across the edges. each edge gets a score.
            </motion.p>
          )}
          {step === 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-100 text-[clamp(15px,1.25vw,20px)]">
              keep the good edges. what remains is a track.
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
