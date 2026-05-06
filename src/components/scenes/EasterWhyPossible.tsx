"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

type Layer = {
  label: string;
  subtitle: string;
  tone: "base" | "crown";
};

const LAYERS: Layer[] = [
  {
    label: "well-tested · automated simulation + data pipeline",
    subtitle: "",
    tone: "base",
  },
  {
    label: "transparent AI/ML codebase",
    subtitle: "",
    tone: "base",
  },
  {
    label: "Claude — directly on the computing cluster",
    subtitle: "",
    tone: "base",
  },
  {
    label: "remote control",
    subtitle: "",
    tone: "base",
  },
  {
    label: "me",
    subtitle: "",
    tone: "crown",
  },
];

const CHECKS: string[] = [
  "Computation",
  "Processing data",
  "Simulating things and comparing with data",
  "Reviewing literature",
  "Working through long analytical arguments",
];

export function EasterWhyPossible({ step = 0 }: { step?: number }) {
  const reversed = [...LAYERS].reverse();
  const showRight = step >= 1;

  return (
    <EasterShell
      beat={10}
      headline="Why was this possible?"
      hint="the stack that caught it"
      align="center"
    >
      <div className="grid md:grid-cols-[1fr_380px] gap-12 max-w-[1200px] w-full items-center">
        <div className="relative">
          <div className="flex flex-col gap-2">
            {reversed.map((layer, i) => {
              const idxFromBottom = LAYERS.length - 1 - i;
              return (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: 0.2 + idxFromBottom * 0.45 },
                  }}
                  className={`relative rounded-md border px-5 py-4 overflow-hidden ${
                    layer.tone === "crown"
                      ? "bg-amber-500/8 border-amber-400/50"
                      : "bg-sky-500/5 border-sky-300/25"
                  }`}
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] ${layer.tone === "crown" ? "bg-amber-400" : "bg-sky-400/70"}`} />
                  <div className="flex items-center gap-4">
                    <div className={`font-mono text-[10px] tabular-nums ${layer.tone === "crown" ? "text-amber-300/80" : "text-sky-300/60"}`}>
                      {String(idxFromBottom + 1).padStart(2, "0")}
                    </div>
                    <div className={`flex-1 font-serif text-[clamp(18px,1.7vw,26px)] leading-tight ${layer.tone === "crown" ? "text-amber-200 italic" : "text-zinc-100"}`}>
                      {layer.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {showRight && (
          <motion.div
            className="font-serif text-zinc-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.9, delay: 0.1 } }}
          >
            <p className="italic text-[clamp(20px,1.85vw,30px)] leading-snug">
              Claude had everything it needed.
            </p>

            <ul className="mt-7 flex flex-col gap-2.5">
              {CHECKS.map((c, i) => (
                <motion.li
                  key={c}
                  className="flex items-baseline gap-3 text-zinc-200 text-[clamp(15px,1.25vw,20px)] leading-snug"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, delay: 0.4 + i * 0.25 },
                  }}
                >
                  <span className="text-emerald-400 text-[1.05em] leading-none">✓</span>
                  <span>{c}</span>
                </motion.li>
              ))}
            </ul>

            <motion.p
              className="mt-8 italic text-amber-200 text-[clamp(22px,2.05vw,34px)] leading-snug"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, delay: 0.4 + CHECKS.length * 0.25 + 0.3 },
              }}
            >
              Automate your science.
            </motion.p>
          </motion.div>
        )}
      </div>
    </EasterShell>
  );
}
