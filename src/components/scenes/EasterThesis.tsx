"use client";

import { motion } from "motion/react";
import { LoopsViz } from "./LoopsViz";

// Returns to the LoopsViz visual (now showing inner + middle loops, step=1)
// while Daniel reads the meta-thesis. The visual sits behind a centred
// caption — the rotating loops should be readable but not screen-stealing.

export function EasterThesis({ step = 0 }: { step?: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      {/* Loops live behind, dimmed */}
      <div className="absolute inset-0 opacity-65 pointer-events-none">
        <LoopsViz step={1} />
      </div>

      {/* Caption rises in centred over the loops */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="max-w-[940px] px-10 font-serif italic text-zinc-100 text-[clamp(20px,2.4vw,38px)] leading-[1.25] text-center backdrop-blur-sm bg-black/40 rounded-2xl py-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.4 } }}
        >
          this is what the middle loop looks like.
          <span className="block mt-3 text-amber-200/90">
            project-level — Easter weekend, one question, one study, one paper.
          </span>

          {step >= 1 && (
            <ul className="mt-7 flex flex-col gap-2 text-zinc-200/85 not-italic font-mono text-[clamp(13px,1.05vw,17px)] tracking-[0.02em] leading-snug text-left mx-auto w-fit">
              {[
                "code autocomplete",
                "ChatGPT · grant proposal language",
                "Google AI mode · literature review",
                "writing a codebase + completing a project",
              ].map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-baseline gap-3"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.45, delay: 0.1 + i * 0.2 },
                  }}
                >
                  <span className="text-amber-300/70">·</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
