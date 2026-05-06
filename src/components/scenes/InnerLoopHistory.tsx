"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState } from "react";

type Card = {
  heading: string;
  body: string;
  footer: string;
  side: "left" | "right";
};

const CARDS: Card[] = [
  {
    heading: "Bruce Denby · 1988",
    body: "Neural networks and cellular automata in experimental high energy physics",
    footer: "Comp. Phys. Comm. 49, 429 · CDS:185108",
    side: "left",
  },
  {
    heading: "Stimpfl-Abele & Garrido · 1991",
    body: "Fast track finding with neural networks",
    footer: "Comp. Phys. Comm. 64, 46 · ALEPH TPC at LEP",
    side: "right",
  },
];

function YearsCounter({ run }: { run: boolean }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!run) return;
    const controls = animate(mv, 38, {
      duration: 1.5,
      ease: [0.2, 0.8, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [run, mv]);

  useTransform(mv, (v) => v);

  return (
    <span className="font-mono text-zinc-100 text-[clamp(20px,2vw,30px)] tabular-nums">
      {display}
    </span>
  );
}

// Layout uses an explicit-row grid so subsequent rows (year ribbon, tally
// counter) reserve space from the start — cards never shift position when
// new content fades in.
export function InnerLoopHistory({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div
        className="absolute inset-0 grid p-10 md:p-14 text-zinc-100"
        style={{
          gridTemplateRows: "auto 1fr auto auto",
          rowGap: "32px",
          justifyItems: "center",
        }}
      >
        {/* Row 1 — title */}
        <motion.div
          className="text-zinc-200 font-serif italic text-[clamp(22px,2.2vw,34px)] leading-tight justify-self-start"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1 } }}
        >
          the inner loop · nearly four decades.
        </motion.div>

        {/* Row 2 — cards */}
        <div className="relative grid grid-cols-2 gap-12 w-full max-w-[1000px] self-center">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.heading}
              className="rounded-md p-6 flex flex-col gap-3 min-h-[200px] border border-white/10 bg-zinc-900/70 shadow-2xl"
              style={{ width: 380, justifySelf: c.side === "left" ? "end" : "start" }}
              initial={{ opacity: 0, x: c.side === "left" ? -60 : 60 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { duration: 0.7, delay: 0.25 + i * 0.25 },
              }}
            >
              <div className="font-serif italic text-zinc-100 text-[clamp(16px,1.5vw,22px)] leading-tight">
                {c.heading}
              </div>
              <div className="font-sans text-[15px] text-zinc-400 leading-snug">
                {c.body}
              </div>
              <div className="mt-auto font-mono text-[10px] text-zinc-500 tracking-wider">
                {c.footer}
              </div>
            </motion.div>
          ))}

          {/* Year ribbon — opacity gated, but reserves no extra row */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.9, transition: { duration: 0.6 } }}
          >
            <div className="font-mono text-[12px] uppercase tracking-[0.25em] text-zinc-300 px-3 py-1 border border-white/15 rounded-sm bg-zinc-900/85">
              1988 → 1991
            </div>
          </motion.div>
        </div>

        {/* Row 3 — reserved tally counter slot */}
        <div className="min-h-[40px] flex items-end gap-2">
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0, transition: { duration: 0.6, delay: 0.2 } }}
          >
            <YearsCounter run={step >= 1} />
            <span className="font-mono text-[12px] uppercase tracking-[0.25em] text-zinc-500">
              years
            </span>
          </motion.div>
        </div>

        {/* Row 4 — reserved spacer (keeps cards visually anchored) */}
        <div className="min-h-[20px]" />
      </div>
    </motion.div>
  );
}
