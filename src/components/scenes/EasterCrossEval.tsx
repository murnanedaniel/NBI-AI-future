"use client";

import { Fragment } from "react";
import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

type Row = { label: string; values: number[]; diagonal: number[]; kind: "fixed" | "rand" | "ckf" };

const COLS = ["Nominal", "Shift 25 μm", "Shift 300 μm"];
const ROWS: Row[] = [
  { label: "Nominal",     values: [0.0147, 0.0230, 0.0559], diagonal: [0],    kind: "fixed" },
  { label: "Shift 25 μm", values: [0.0233, 0.0149, 0.0572], diagonal: [1],    kind: "fixed" },
  { label: "Shift 300 μm",values: [0.0526, 0.0537, 0.0151], diagonal: [2],    kind: "fixed" },
  { label: "Randomized",  values: [0.0355, 0.0352, 0.0355], diagonal: [],     kind: "rand" },
  { label: "CKF (ref)",   values: [0.0318, 0.0317, 0.0321], diagonal: [],     kind: "ckf" },
];

function severity(v: number) {
  if (v < 0.018) return "bg-sky-400/90 text-zinc-900";
  if (v < 0.028) return "bg-sky-400/40 text-zinc-100";
  if (v < 0.04)  return "bg-zinc-700/70 text-zinc-100";
  if (v < 0.05)  return "bg-amber-500/40 text-zinc-100";
  return "bg-rose-500/70 text-zinc-100";
}

export function EasterCrossEval() {
  return (
    <EasterShell
      beat={4}
      headline="Trained on one beamspot, tested on another."
      hint="Table 3 · d₀ IQR/1.349 [mm]"
      align="top"
    >
      <div className="grid md:grid-cols-[1fr_380px] gap-10 items-start max-w-[1200px] w-full">
        <div className="font-mono text-[13px]">
          <div className="grid grid-cols-[160px_repeat(3,110px)] gap-1 text-center">
            <div></div>
            {COLS.map((c) => (
              <div key={c} className="text-zinc-400 pb-2 uppercase tracking-wider text-[10px]">
                eval · {c}
              </div>
            ))}
            {ROWS.map((row, rIdx) => (
              <Fragment key={row.label}>
                <div className={`text-right pr-3 py-2 ${row.kind === "rand" ? "text-emerald-300" : row.kind === "ckf" ? "text-zinc-500" : "text-zinc-300"}`}>
                  {row.kind !== "ckf" ? "train · " : ""}{row.label}
                </div>
                {row.values.map((v, cIdx) => {
                  const isDiag = row.diagonal.includes(cIdx);
                  return (
                    <motion.div
                      key={row.label + cIdx}
                      className={`py-2 rounded-sm tabular-nums ${severity(v)} ${isDiag ? "ring-1 ring-white/40" : ""}`}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, delay: 0.15 + (rIdx * 3 + cIdx) * 0.09 } }}
                    >
                      {v.toFixed(4)}
                    </motion.div>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-zinc-500 flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-sky-400/90"/> better than CKF</span>
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-zinc-700/70"/> ≈ CKF</span>
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-500/40"/> worse</span>
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rose-500/70"/> much worse</span>
          </div>
        </div>

        <motion.div
          className="font-serif italic text-zinc-300 text-[clamp(16px,1.35vw,22px)] leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 1.8 } }}
        >
          <p>Every fixed-beamspot model wins on-diagonal.</p>
          <p className="mt-3">Push it 300 μm off — <span className="text-rose-300">1.8× worse than CKF</span>.</p>
          <p className="mt-5 not-italic font-sans text-zinc-300 text-[15px] leading-relaxed">
            The models had learned the <em>specific</em> beam spot they were trained on. None of them had learned how to fit tracks.
          </p>
          <p className="mt-3 not-italic font-sans text-emerald-300 text-[15px]">
            One row breaks the pattern — the randomized-beamspot model. At a cost of 12% vs CKF.
          </p>
        </motion.div>
      </div>
    </EasterShell>
  );
}
