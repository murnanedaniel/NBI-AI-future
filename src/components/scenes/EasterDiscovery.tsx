"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

type PanelConfig = { label: string; unit: string; truthStd: number; residualStd: number; r2: number; range: number };

const PANELS: PanelConfig[] = [
  { label: "vₓ",  unit: "μm", truthStd: 327, residualStd: 76, r2: 0.946, range: 900 },
  { label: "vᵧ",  unit: "μm", truthStd: 290, residualStd: 72, r2: 0.939, range: 800 },
  { label: "v_z", unit: "mm", truthStd: 55.3, residualStd: 2.6, r2: 0.998, range: 180 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Panel({ cfg, delay }: { cfg: PanelConfig; delay: number }) {
  const W = 280;
  const H = 280;
  const PAD = 40;
  const rand = seededRandom(cfg.label.charCodeAt(0) * 31);

  const points = Array.from({ length: 220 }, () => {
    const g1 = () => {
      let u = 0, v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const x = g1() * cfg.truthStd;
    const y = x + g1() * cfg.residualStd;
    return { x, y };
  });

  const toX = (v: number) => PAD + ((v + cfg.range / 2) / cfg.range) * (W - 2 * PAD);
  const toY = (v: number) => H - PAD - ((v + cfg.range / 2) / cfg.range) * (H - 2 * PAD);

  return (
    <motion.div
      className="bg-zinc-950/40 border border-white/10 rounded-md p-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay } }}
    >
      <div className="flex items-baseline justify-between px-2 mb-1">
        <div className="font-serif italic text-zinc-200 text-[20px]">{cfg.label}</div>
        <div className="font-mono text-[11px] text-zinc-400">R² = <span className="text-emerald-300">{cfg.r2.toFixed(3)}</span></div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.18)" />
        <line x1={PAD} x2={PAD} y1={PAD} y2={H - PAD} stroke="rgba(255,255,255,0.18)" />
        <line x1={toX(-cfg.range / 2)} y1={toY(-cfg.range / 2)} x2={toX(cfg.range / 2)} y2={toY(cfg.range / 2)}
          stroke="#52525b" strokeDasharray="3 4" />
        {points.map((p, i) => {
          const inRange = Math.abs(p.x) < cfg.range / 2 && Math.abs(p.y) < cfg.range / 2;
          if (!inRange) return null;
          return (
            <motion.circle
              key={i}
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={1.6}
              fill="#7dd3fc"
              fillOpacity={0.7}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8, transition: { duration: 0.2, delay: delay + 0.4 + (i * 0.004) } }}
            />
          );
        })}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#71717a" fontFamily="var(--font-geist-mono)">true {cfg.label} [{cfg.unit}]</text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="10" fill="#71717a" fontFamily="var(--font-geist-mono)" transform={`rotate(-90, 12, ${H / 2})`}>probe [{cfg.unit}]</text>
      </svg>
    </motion.div>
  );
}

export function EasterDiscovery() {
  return (
    <EasterShell
      beat={7}
      headline="What the model was really doing."
      hint={<>Fig 6 · linear probe · [EVT] → primary vertex</>}
      align="top"
    >
      <div className="max-w-[1300px] w-full">
        <div className="grid md:grid-cols-3 gap-4">
          {PANELS.map((cfg, i) => <Panel key={cfg.label} cfg={cfg} delay={0.2 + i * 0.25} />)}
        </div>

        <motion.div
          className="mt-8 grid md:grid-cols-[1fr_360px] gap-10 items-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 2.2 } }}
        >
          <div className="font-serif italic text-zinc-300 text-[clamp(17px,1.5vw,24px)] leading-snug">
            <p>We fit a linear probe from the <span className="text-amber-300">[EVT]</span> token to the true primary vertex.</p>
            <p className="mt-3">
              R² of <span className="text-emerald-300">0.946 / 0.939 / 0.998</span> for vₓ / vᵧ / v_z.
            </p>
            <p className="mt-4 not-italic font-sans text-zinc-300 text-[15px]">
              No one told the model that the primary vertex existed. It worked it out from the ensemble of tracks, then used its own estimate as an implicit beam-spot constraint.
            </p>
          </div>
          <div className="font-mono text-[12px] text-zinc-400 space-y-2">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider">from the paper</div>
            <div>&ldquo;The bug is, with the right architecture, an opportunity: the model discovers the beam spot from the data itself.&rdquo;</div>
            <div className="text-zinc-500">— §5, Discussion</div>
          </div>
        </motion.div>
      </div>
    </EasterShell>
  );
}
