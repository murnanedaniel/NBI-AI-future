"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

const W = 720;
const H = 360;
const PAD = { left: 56, right: 20, top: 24, bottom: 44 };
const X_MIN = -0.14;
const X_MAX = 0.14;
const Y_MAX = 35;

function xScale(x: number) {
  return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - PAD.left - PAD.right);
}
function yScale(y: number) {
  return H - PAD.bottom - (y / Y_MAX) * (H - PAD.top - PAD.bottom);
}

function gaussianPath(sigma: number, amplitude: number) {
  const points: string[] = [];
  const N = 160;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const y = amplitude * Math.exp(-(x * x) / (2 * sigma * sigma));
    points.push(`${i === 0 ? "M" : "L"}${xScale(x).toFixed(2)},${yScale(y).toFixed(2)}`);
  }
  return points.join(" ");
}

export function EasterSmokingGun() {
  const ckf = gaussianPath(0.02625, 15);
  const ml = gaussianPath(0.01205, 33);
  const bs = gaussianPath(0.01227, 33);

  return (
    <EasterShell
      beat={3}
      headline="the smoking gun."
      hint={<>Fig 1a · d₀ residual · nominal</>}
      align="top"
    >
      <div className="grid md:grid-cols-[1fr_380px] gap-10 items-start max-w-[1200px] w-full">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            <line x1={xScale(0)} x2={xScale(0)} y1={yScale(0)} y2={yScale(Y_MAX)} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
            <line x1={PAD.left} x2={W - PAD.right} y1={yScale(0)} y2={yScale(0)} stroke="rgba(255,255,255,0.2)" />
            <line x1={PAD.left} x2={PAD.left} y1={yScale(0)} y2={yScale(Y_MAX)} stroke="rgba(255,255,255,0.2)" />

            {[-0.1, -0.05, 0, 0.05, 0.1].map((x) => (
              <g key={x}>
                <line x1={xScale(x)} x2={xScale(x)} y1={yScale(0)} y2={yScale(0) + 4} stroke="rgba(255,255,255,0.3)" />
                <text x={xScale(x)} y={yScale(0) + 18} textAnchor="middle" fontSize="10" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">{x.toFixed(2)}</text>
              </g>
            ))}
            <text x={(W - PAD.left - PAD.right) / 2 + PAD.left} y={H - 8} textAnchor="middle" fontSize="11" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">d₀ residual [mm]</text>

            {[0, 10, 20, 30].map((y) => (
              <g key={y}>
                <line x1={PAD.left - 4} x2={PAD.left} y1={yScale(y)} y2={yScale(y)} stroke="rgba(255,255,255,0.3)" />
                <text x={PAD.left - 8} y={yScale(y) + 4} textAnchor="end" fontSize="10" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">{y}</text>
              </g>
            ))}

            <motion.path d={ckf} fill="none" stroke="#f87171" strokeWidth="1.8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 0.2 } }}
            />
            <motion.path d={ml} fill="none" stroke="#7dd3fc" strokeWidth="2.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 1.6 } }}
            />
            <motion.path d={bs} fill="none" stroke="#a1a1aa" strokeWidth="1.6" strokeDasharray="4 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 3.0 } }}
            />

            <g fontFamily="var(--font-geist-mono)" fontSize="11">
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.0 } }}>
                <rect x={W - 210} y={30} width="10" height="2" fill="#f87171" />
                <text x={W - 196} y={34} fill="#f87171">CKF · σ = 0.0318</text>
              </motion.g>
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 2.4 } }}>
                <rect x={W - 210} y={50} width="10" height="2" fill="#7dd3fc" />
                <text x={W - 196} y={54} fill="#7dd3fc">ML · σ = 0.0147</text>
              </motion.g>
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 3.8 } }}>
                <rect x={W - 210} y={70} width="10" height="2" fill="#a1a1aa" />
                <text x={W - 196} y={74} fill="#a1a1aa">predict zero · σ = 0.0159</text>
              </motion.g>
            </g>
          </svg>
        </div>

        <motion.div
          className="font-serif italic text-zinc-300 text-[clamp(16px,1.35vw,22px)] leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 4.2 } }}
        >
          <p>The ML model achieves <span className="text-sky-300">0.0147 mm</span>.</p>
          <p className="mt-3">
            Predicting literally <span className="text-zinc-400">zero</span> — no model, no training, no hits — gets you <span className="text-zinc-400">0.0159 mm</span>.
          </p>
          <p className="mt-3 text-zinc-400">
            Eight percent apart.
          </p>
          <p className="mt-5 not-italic font-sans text-zinc-300 text-[15px] leading-relaxed">
            The 2× win was never track fitting. It was the model learning where the beam spot sits and predicting that.
          </p>
        </motion.div>
      </div>
    </EasterShell>
  );
}
