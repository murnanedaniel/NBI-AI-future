"use client";

import { motion } from "motion/react";

type Stop = {
  id: string;
  year: string;
  time: string;
  sub: string;
  stateKey: "past" | "now" | "projected";
};

const STOPS: Stop[] = [
  { id: "a", year: "2020", time: "~30 seconds",      sub: "Exa.TrkX prototype · CPU baseline", stateKey: "past" },
  { id: "b", year: "2025", time: "~100 milliseconds", sub: "GNN4ITk · single GPU",             stateKey: "now" },
  { id: "c", year: "target", time: "~10 milliseconds",  sub: "trigger-level · projected",       stateKey: "projected" },
];

export function SpeedJourney({ step }: { step: number }) {
  const W = 1100;
  const H = 300;
  const left = 80;
  const right = W - 80;
  const axisY = H - 90;
  const positions = [left, (left + right) / 2, right];

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
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · the journey</div>
            <div className="mt-2 font-serif italic text-zinc-100 text-[clamp(26px,2.8vw,42px)] leading-tight">
              how fast we got, how fast we&rsquo;re getting.
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 text-right">
            <div>time per event · ATLAS tracking</div>
            <div>see FACTS.md for exact citations</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[1200px] h-auto">
            <motion.line
              x1={left} y1={axisY} x2={right} y2={axisY}
              stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, transition: { duration: 1.2, delay: 0.2 } }}
            />
            <motion.polyline
              points={`${right - 8},${axisY - 5} ${right},${axisY} ${right - 8},${axisY + 5}`}
              fill="none" stroke="#7dd3fc" strokeOpacity="0.5" strokeWidth="1.2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.2 } }}
            />

            {STOPS.map((s, i) => {
              const x = positions[i];
              const visible = step >= i;
              const clockR = i === 0 ? 28 : i === 1 ? 16 : 8;
              return (
                <motion.g
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10, transition: { duration: 0.55 } }}
                >
                  <line x1={x} y1={axisY - 6} x2={x} y2={axisY + 6} stroke="#a1a1aa" strokeOpacity="0.8" />

                  <g transform={`translate(${x},${axisY - 60})`}>
                    <circle r={clockR} fill="none" stroke={s.stateKey === "projected" ? "#7dd3fc" : "#e4e4e7"} strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray={s.stateKey === "projected" ? "3 3" : ""} />
                    <line x1="0" y1="0" x2="0" y2={-clockR * 0.65} stroke={s.stateKey === "projected" ? "#7dd3fc" : "#e4e4e7"} strokeOpacity="0.7" strokeWidth="1.2" />
                    <line x1="0" y1="0" x2={clockR * 0.5} y2="0" stroke={s.stateKey === "projected" ? "#7dd3fc" : "#e4e4e7"} strokeOpacity="0.45" strokeWidth="1.2" />
                  </g>

                  <text x={x} y={axisY + 28} textAnchor="middle" fontSize="11" fill="#a1a1aa" fontFamily="var(--font-geist-mono)" letterSpacing="0.15em">{s.year.toUpperCase()}</text>

                  <text x={x} y={axisY + 58} textAnchor="middle" fontSize="22" fill="#f4f4f5" fontFamily="var(--font-serif)" fontStyle="italic">{s.time}</text>

                  <text x={x} y={axisY + 82} textAnchor="middle" fontSize="11" fill="#71717a" fontFamily="var(--font-geist-mono)">{s.sub}</text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-center">
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }}
              className="font-serif italic text-zinc-300 text-[clamp(20px,2vw,30px)] text-center"
            >
              five years.<br />
              <span className="text-zinc-100">three thousand times faster.</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
