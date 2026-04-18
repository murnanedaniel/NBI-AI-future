"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

export function EasterBug() {
  return (
    <EasterShell
      beat={2}
      headline="&ldquo;I think there&rsquo;s a bug.&rdquo;"
      hint="placeholder — real bug-report text TK"
    >
      <div className="grid md:grid-cols-[420px_1fr] gap-10 items-center max-w-[1100px]">
        <motion.div
          className="bg-zinc-900/60 border border-white/10 rounded-md p-5 font-mono text-[13px] text-zinc-300 leading-relaxed shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.7 } }}
        >
          <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3 text-zinc-500 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
            <span>colliderml/issues #142</span>
          </div>
          <div className="text-zinc-400">Subject:</div>
          <div className="mb-3">ML baseline beats CKF on d₀ by 2× — is this a bug?</div>
          <div className="text-zinc-400">From:</div>
          <div className="mb-3">a graduate student, somewhere</div>
          <div className="text-zinc-500 italic text-[12px]">
            &ldquo;Our per-track transformer hits d₀ resolution of 0.015 mm on your nominal dataset. The Kalman filter we compared against gets 0.032 mm. That&rsquo;s a factor-of-two improvement with no feature engineering — which seems too good. Are we doing something wrong?&rdquo;
          </div>
        </motion.div>

        <motion.div
          className="font-serif text-zinc-300 text-[clamp(18px,1.6vw,26px)] leading-relaxed italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9, delay: 0.6 } }}
        >
          <p>
            Everyone in ML tracking has seen this number.
          </p>
          <p className="mt-4 text-zinc-400">
            A 2× win on <span className="text-sky-300">d₀</span> without breaking a sweat.
          </p>
          <p className="mt-4 text-zinc-500">
            No one had asked why.
          </p>
        </motion.div>
      </div>
    </EasterShell>
  );
}
