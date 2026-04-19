"use client";

import { motion } from "motion/react";

export function TitleSlide({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        y: "-110%",
        rotate: -2,
        scale: 0.96,
        opacity: 0,
        transition: { duration: 1.1, ease: [0.7, 0, 0.3, 1] },
      }}
    >
      <div className="paper-texture relative w-[78%] max-w-[1100px] aspect-[16/10] rounded-sm shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between p-[5%] text-ink" style={{ fontFamily: "var(--font-serif)" }}>
          <div className="flex items-start justify-between text-[13px] tracking-wide text-ink/60">
            <span>NBI Faculty Retreat · May 2026</span>
            <span>1 / 40</span>
          </div>

          <div className="px-[4%]">
            {step >= 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                className="text-[14px] uppercase tracking-[0.2em] text-ink/50 mb-6"
              >
                Invited Talk
              </motion.div>
            )}

            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              >
                <h1 className="text-[clamp(36px,5.2vw,84px)] leading-[1.05] text-ink">
                  AI in Research
                </h1>
                <h2 className="text-[clamp(22px,2.8vw,44px)] leading-[1.1] mt-3 text-ink/70 italic">
                  Future perspectives
                </h2>
              </motion.div>
            )}

            {step >= 2 && (
              <motion.div
                className="mt-12 flex items-baseline gap-4 text-[clamp(14px,1.3vw,20px)] text-ink/70"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              >
                <span className="text-ink">Daniel Murnane</span>
                <span className="text-ink/40">·</span>
                <span>Niels Bohr Institute</span>
                <span className="text-ink/40">·</span>
                <span>ATLAS Collaboration</span>
              </motion.div>
            )}
          </div>

          <div className="flex items-end justify-between text-[12px] text-ink/50">
            <span>Copenhagen</span>
            {step >= 2 ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.5 } }}
                className="italic"
              >
                press <kbd className="not-italic px-1.5 py-0.5 bg-ink/10 rounded">space</kbd> to begin
              </motion.span>
            ) : (
              <span className="invisible">.</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
