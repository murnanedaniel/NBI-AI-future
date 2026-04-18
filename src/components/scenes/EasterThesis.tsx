"use client";

import { motion } from "motion/react";

const LINE_A = "I wasn't using AI to solve a physics problem.";
const LINE_B = "I was using AI to figure out how to use AI";
const LINE_C = "to solve the physics problem.";

export function EasterThesis() {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-[1000px] px-10 font-serif italic text-zinc-100 text-[clamp(28px,3.8vw,60px)] leading-[1.2]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.6 } }}
          >
            {LINE_A}
          </motion.div>
          <motion.div
            className="mt-4 text-zinc-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 3.0 } }}
          >
            {LINE_B}
          </motion.div>
          <motion.div
            className="text-zinc-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 3.9 } }}
          >
            <span className="text-amber-300">{LINE_C}</span>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[11px] text-zinc-600 tracking-[0.3em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 1.0, delay: 6.0 } }}
      >
        that&rsquo;s the point
      </motion.div>
    </motion.div>
  );
}
