"use client";

import { motion } from "motion/react";
import { LoopsViz } from "./LoopsViz";

// Third appearance of the loops visual: all three loops (inner + middle +
// outer). Lands after ScienceDash, when the talk pivots from "what does
// your day look like" → "what does your publication / collaboration / career
// look like". Light theme since we're past the calendar flip.
//   Step 0: loops only.
//   Step 1: reveals "What does publication look like in 2028?"
//   Step 2: reveals "What does collaboration look like in 2028?"
const QUESTIONS = [
  "What does publication look like in 2028?",
  "What does collaboration look like in 2028?",
];

export function LoopsVizOuter({ step = 0 }: { step?: number }) {
  return (
    <div className="absolute inset-0">
      <LoopsViz step={2} theme="light" hideHeadline={step >= 1} />
      {step >= 1 && (
        <motion.div
          key={step}
          className="absolute top-[6vh] left-1/2 -translate-x-1/2 font-serif italic text-ink text-center pointer-events-none"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } }}
        >
          <div className="text-[clamp(26px,3vw,46px)] leading-tight">
            {QUESTIONS[Math.min(step - 1, QUESTIONS.length - 1)]}
          </div>
        </motion.div>
      )}
    </div>
  );
}
