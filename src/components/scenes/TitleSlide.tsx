"use client";

import { motion } from "motion/react";

export function TitleSlide({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ perspective: 1600 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 1,
        transition: { duration: 1.2 },
      }}
    >
      <motion.div
        className="paper-texture relative w-[78%] max-w-[1100px] aspect-[16/10] rounded-sm overflow-hidden"
        style={{
          transformStyle: "preserve-3d",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.08)",
        }}
        initial={{ rotateX: 0, scaleY: 1, y: 0 }}
        animate={{ rotateX: 0, scaleY: 1, y: 0 }}
        exit={{
          rotateX: -86,
          scaleY: 0.22,
          y: 0,
          transition: { duration: 1.15, ease: [0.6, 0, 0.25, 1] },
        }}
      >
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
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className="text-[14px] uppercase tracking-[0.2em] text-ink/50 mb-6"
              >
                Invited Talk
              </motion.div>
            )}

            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
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
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
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
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="italic"
              >
                press <kbd className="not-italic px-1.5 py-0.5 bg-ink/10 rounded">space</kbd> to begin
              </motion.span>
            ) : (
              <span className="invisible">.</span>
            )}
          </div>
        </div>

        {/* beam glow that bleeds in as the paper rolls flat */}
        <motion.div
          className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 pointer-events-none"
          style={{
            background: "linear-gradient(to right, transparent, #7dd3fc, transparent)",
            boxShadow: "0 0 14px #7dd3fcaa",
          }}
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 0, scaleX: 0.3 }}
          exit={{
            opacity: 1,
            scaleX: 1,
            transition: { duration: 1.1, ease: [0.6, 0, 0.25, 1] },
          }}
        />
      </motion.div>
    </motion.div>
  );
}
