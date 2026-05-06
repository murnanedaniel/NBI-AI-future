"use client";

import { motion } from "motion/react";

const BULLETS: { lead: string; rest: string }[] = [
  { lead: "collaborate", rest: "cross-section bridges, matchmaking, drafting" },
  { lead: "promote tools", rest: "ScienceDash-style platform, shared HPC stacks" },
  { lead: "student guidance", rest: "dedicated courses, group-level policies" },
  { lead: "PhD v2", rest: "ambition · new phenomena" },
  { lead: "first-principles attitude", rest: "" },
];

export function NBIAINativeCallToAction({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col justify-center p-10 md:p-16">
        <div className="max-w-[1100px] w-full mx-auto">
          <motion.div
            className="font-serif text-ink text-[clamp(32px,4vw,64px)] leading-[1.05]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.2 } }}
          >
            NBI <span className="text-ink/40">·</span> AI-native research institute
          </motion.div>

          <motion.ul className="mt-12 flex flex-col gap-4">
            {BULLETS.map((b, i) => {
              const visible = step >= i + 1;
              return (
                <motion.li
                  key={b.lead}
                  className="font-serif text-ink text-[clamp(18px,1.8vw,28px)] leading-snug flex items-baseline gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{
                    opacity: visible ? 1 : 0,
                    x: visible ? 0 : -12,
                    transition: { duration: 0.55, delay: visible ? 0.1 : 0 },
                  }}
                >
                  <span className="font-mono text-[12px] text-ink/40 tabular-nums w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong className="font-bold">{b.lead}</strong>
                    {b.rest && <span className="text-ink/55"> · {b.rest}</span>}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </motion.div>
  );
}
