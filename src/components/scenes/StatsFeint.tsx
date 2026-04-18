"use client";

import { motion } from "motion/react";

type Tile = { kind: "stat" | "quote" | "chart"; primary: string; secondary: string };

const TILES: Tile[] = [
  { kind: "stat",  primary: "72%", secondary: "of physics PhDs use AI weekly (AAAS 2026)" },
  { kind: "stat",  primary: "400k+", secondary: "arXiv papers mentioning LLM in 2025" },
  { kind: "stat",  primary: "$1.2T", secondary: "global AI infra spend, 2026" },
  { kind: "stat",  primary: "8,200", secondary: "papers in Google Scholar co-authored with Claude" },
  { kind: "quote", primary: "“AI is the most transformative technology of our lifetime”", secondary: "— every keynote since 2023" },
  { kind: "chart", primary: "↗", secondary: "LLM adoption, academia, 2019–2026 (fabricated for effect)" },
];

export function StatsFeint() {
  return (
    <motion.div
      className="absolute inset-0 bg-canvas overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{
        backgroundColor: "#f6f1e7",
        transition: { duration: 1.4, ease: [0.65, 0, 0.3, 1] },
      }}
    >
      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 3 · AI in research, by the numbers</div>
          <div className="mt-2 text-[clamp(26px,3vw,40px)] font-sans text-zinc-100 leading-tight">
            What everyone has put on their AI slide.
          </div>
        </motion.div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="grid grid-cols-3 gap-5 max-w-[1100px] w-full"
            exit={{
              scale: 0.05,
              opacity: 0,
              filter: "blur(4px)",
              transition: { duration: 1.2, ease: [0.7, 0, 0.3, 1] },
            }}
          >
            {TILES.map((tile, i) => (
              <motion.div
                key={i}
                className="bg-zinc-900/70 border border-white/10 rounded-md p-6 min-h-[150px] flex flex-col justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.25 + i * 0.1 } }}
              >
                <div className={`font-serif ${tile.kind === "quote" ? "text-[18px] italic leading-snug text-zinc-200" : "text-[clamp(30px,3.8vw,54px)] text-zinc-100"}`}>
                  {tile.primary}
                </div>
                <div className="mt-3 font-mono text-[11px] text-zinc-400 leading-snug">
                  {tile.secondary}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="font-serif italic text-zinc-300 text-[clamp(20px,1.9vw,30px)] text-center leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, delay: 2.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          …but that won&rsquo;t convince you if you&rsquo;re not already convinced.
        </motion.div>
      </div>
    </motion.div>
  );
}
