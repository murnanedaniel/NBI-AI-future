"use client";

import { motion } from "motion/react";

// PLACEHOLDER — Daniel regenerates pre-talk with a prompt like:
//   "You've just read this entire talk. What is the one question you want to
//    ask this NBI faculty audience? Make it specific, something only you
//    would think to ask after seeing everything I've shown them."
// Keep the attribution line exactly as below — the source is the punch.
const QUESTION =
  "How much of the research you're about to do already exists — unconverted — in the work you've already done?";

export function CloseQuestion({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.0 } }}
      exit={{ opacity: 0, transition: { duration: 0.7 } }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-10">
        <div className="max-w-[1100px] text-center">
          <motion.div
            className="font-serif italic text-ink text-[clamp(26px,3.4vw,52px)] leading-[1.22]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.1 } }}
          >
            {QUESTION}
          </motion.div>

          {step >= 1 && (
            <motion.div
              className="mt-12 font-mono text-[11px] tracking-[0.3em] uppercase text-ink/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1.0 } }}
            >
              — what Claude wanted to ask you, after reading this talk
            </motion.div>
          )}
        </div>
      </div>

      {step >= 1 && (
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] uppercase text-ink/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1.4, delay: 1.5 } }}
        >
          thank you
        </motion.div>
      )}
    </motion.div>
  );
}
