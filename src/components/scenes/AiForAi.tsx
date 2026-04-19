"use client";

import { motion } from "motion/react";

export function AiForAi({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.0 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="max-w-[1100px] px-10 font-serif italic text-[clamp(26px,3.2vw,48px)] leading-[1.25] text-center">
        <motion.div
          className="text-zinc-100"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        >
          this talk is not about{" "}
          <span className="text-zinc-400">using AI for science.</span>
        </motion.div>

        {step >= 1 && (
          <motion.div
            className="mt-8 text-zinc-100"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.1 } }}
          >
            it&rsquo;s about{" "}
            <span className="text-amber-300">using AI to use AI</span>{" "}
            for science.
          </motion.div>
        )}
      </div>

      {step >= 1 && (
        <motion.div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.3em] uppercase text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 1.5 } }}
        >
          that&rsquo;s the whole thing
        </motion.div>
      )}
    </motion.div>
  );
}
