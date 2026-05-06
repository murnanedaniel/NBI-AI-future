"use client";

import { motion } from "motion/react";

type Card = {
  uni: string;
  summary: string;
  cite: string;
};

const CARDS: Card[] = [
  {
    uni: "Harvard",
    summary: "active-learning physics class beats traditional lecture",
    cite: "PS2 physics · Kestin & Miller · Fall 2023, n=194",
  },
  {
    uni: "Stanford",
    summary: "AI-tutored math students outperform a control cohort",
    cite: "math AI tutor · RCT · 2025",
  },
  {
    uni: "Carnegie Mellon",
    summary: "AI scaffolds + human instructor lift gains across the board",
    cite: "human-AI hybrid tutoring · 2025",
  },
];

// Layout uses an explicit-row CSS grid so that the headline row is
// reserved from step 0 — when the headline appears at step 1 it doesn't
// reflow the cards above it.
export function ReverseLectureEvidence({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 grid p-10 md:p-16"
           style={{ gridTemplateRows: "auto auto 1fr auto auto", justifyItems: "center", rowGap: "32px" }}>
        {/* row 1 — empty header spacer */}
        <div />

        {/* row 2 — three university cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1240px] w-full">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.uni}
              className="rounded-md border border-ink/15 bg-paper ink-shadow p-6 flex flex-col gap-4 min-h-[220px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, delay: i * 0.25 } }}
            >
              <div className="font-serif text-ink text-[clamp(24px,2.2vw,36px)] leading-tight">
                {c.uni}
              </div>
              <div className="font-serif text-ink/75 text-[clamp(15px,1.25vw,19px)] leading-snug flex-1">
                {c.summary}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink/55 leading-snug">
                {c.cite}
              </div>
            </motion.div>
          ))}
        </div>

        {/* row 3 — flexible spacer (kept empty so the headline anchors lower) */}
        <div />

        {/* row 4 — reserved headline slot (always present, content fades in) */}
        <div className="min-h-[160px] flex items-end">
          <motion.div
            className="font-serif italic text-ink text-[clamp(48px,6.5vw,80px)] leading-none text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0, transition: { duration: 0.7, delay: 0.1 } }}
          >
            ~2× learning rate
          </motion.div>
        </div>

        {/* row 5 — reserved citation slot */}
        <div className="min-h-[28px]">
          <motion.div
            className="font-mono text-[12px] uppercase tracking-[0.25em] text-ink/55 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0, transition: { duration: 0.7, delay: 0.3 } }}
          >
            Kestin &amp; Miller · Sci. Rep. 2025 · RCT, N=194
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
