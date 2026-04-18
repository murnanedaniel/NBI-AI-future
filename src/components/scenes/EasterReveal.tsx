"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

const FACTS = [
  ["wall clock",        "24 hours (placeholder)"],
  ["CPU-h",             "~42,800 (placeholder)"],
  ["GPU-h",             "~684 (placeholder)"],
  ["Perlmutter nodes",  "dozens"],
  ["datasets generated", "4"],
  ["models trained",     "12+"],
  ["pages of paper",     "16"],
  ["figures",            "5"],
  ["tables",             "7"],
];

export function EasterReveal() {
  return (
    <EasterShell
      beat={8}
      headline="And then — a paper."
      hint={<>placeholder · collaborator quote TK</>}
    >
      <div className="grid md:grid-cols-[420px_1fr] gap-12 max-w-[1200px] w-full items-center">
        <motion.div
          className="relative"
          initial={{ opacity: 0, rotate: -2, y: 20 }}
          animate={{ opacity: 1, rotate: -1.5, y: 0, transition: { duration: 0.9 } }}
        >
          <div className="paper-texture rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] aspect-[1/1.3] p-8 text-ink" style={{ fontFamily: "var(--font-serif)" }}>
            <div className="text-[11px] text-ink/60">April 7, 2026</div>
            <div className="mt-6 text-[18px] leading-tight text-ink">
              Beam Spot Sensitivity in ML-Based Track Parameter Regression
            </div>
            <div className="mt-6 text-[10px] text-ink/70">
              Daniel T. Murnane<br />
              Niels Bohr Institute · LBNL
            </div>
            <div className="mt-5 text-[9px] leading-[1.5] text-ink/80">
              <span className="font-bold">Abstract.</span> Machine learning approaches to charged particle track fitting report resolution improvements over the Kalman filter, particularly for the transverse impact parameter d₀. We investigate the source of these improvements…
            </div>
            <div className="mt-4 border-t border-ink/20 pt-2 text-[9px] text-ink/50 grid grid-cols-2 gap-x-3">
              <span>1. Introduction</span>
              <span>2. Experimental setup</span>
              <span>3. Methods</span>
              <span>4. Results</span>
              <span>5. Discussion</span>
              <span>6. Conclusion</span>
            </div>
          </div>
        </motion.div>

        <div>
          <motion.div
            className="font-serif italic text-zinc-300 text-[clamp(18px,1.6vw,26px)] leading-snug"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.8 } }}
          >
            <p>Read by world experts on tracking.</p>
            <p className="mt-3">
              Verdict: <span className="text-emerald-300 not-italic">rigorous · novel · ship it.</span>
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid grid-cols-3 gap-x-6 gap-y-2 font-mono text-[12px] tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: 1.3 } }}
          >
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{k}</span>
                <span className="text-zinc-200">{v}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 text-zinc-400 text-[15px] max-w-[520px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8, delay: 1.9 } }}
          >
            I never looked at the code. I never looked at the raw numbers.
          </motion.div>
        </div>
      </div>
    </EasterShell>
  );
}
