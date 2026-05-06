"use client";

import { motion } from "motion/react";

// The paper-roll effect is no longer handled here — it lives in
// <PaperRollOverlay> at the Stage level, so it can persist into RateRamp's
// proton/flicker steps and fade only when the grid scene begins.
// TitleSlide now just fades the CSS paper out on exit; the overlay's rolling
// animation starts as soon as the scene advances past this one.

export function TitleSlide({ step: _step }: { step: number }) {
  // The cream paper rectangle is rendered by <PaperRollOverlay> at z-30.
  // TitleSlide holds only the text, positioned identically (w-[78%],
  // max-w-[1100px], aspect-[16/10]) so text sits on top of the overlay paper.
  // z-40 keeps text above the overlay; on exit, only the text fades.
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <div className="relative w-[78%] max-w-[1100px] aspect-[16/10]">
        <div
          className="absolute inset-0 flex flex-col justify-between p-[5%] text-ink"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          <div className="flex items-start justify-between text-[13px] tracking-wide text-ink/60">
            <span>NBI Faculty Retreat · April 2026</span>
            <span>1 / 30</span>
          </div>

          <div className="px-[4%]">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }}
            >
              <h1 className="text-[clamp(36px,5.2vw,84px)] leading-[1.05] text-ink">
                AI in Research
              </h1>
              <h2 className="text-[clamp(22px,2.8vw,44px)] leading-[1.1] mt-3 text-ink/70 italic">
                Future perspectives
              </h2>
            </motion.div>

            <motion.div
              className="mt-12 flex items-baseline gap-4 text-[clamp(14px,1.3vw,20px)] text-ink/70"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              <span className="text-ink">Daniel Murnane</span>
              <span className="text-ink/40">·</span>
              <span>Niels Bohr Institute</span>
              <span className="text-ink/40">·</span>
              <span>Subatomic Physics</span>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
