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
      {step < 1 && (
        <div className="max-w-[1100px] px-10 font-serif italic text-[clamp(26px,3.2vw,48px)] leading-[1.25] text-center">
          <motion.div
            className="text-zinc-100"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
          >
            this talk is not about{" "}
            <span className="text-zinc-400">using AI for science.</span>
          </motion.div>
        </div>
      )}

      {step >= 1 && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10 py-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7 } }}
        >
          <motion.img
            src="/img/quirks_fig1.png"
            alt="quirky tracks (BSM) — same model, standard tracks vs quirks"
            className="max-h-[72vh] max-w-[1100px] w-auto h-auto object-contain"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.1 } }}
          />
          <motion.div
            className="font-mono text-[11px] tracking-[0.3em] uppercase text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.6 } }}
          >
            same model · standard tracks · quirks
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
