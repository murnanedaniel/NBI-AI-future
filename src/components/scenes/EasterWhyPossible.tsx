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
    label: "automated simulation + data pipeline",
    subtitle: "ColliderML · config → HepMC → Geant4 → reco → eval · one command.",
    tone: "base",
  },
  {
    label: "battle-tested domain code",
    subtitle: "ACORN · ATLAS tracking · Claude reads the tests, doesn't guess the physics.",
    tone: "base",
  },
  {
    label: "Claude lives on the HPC",
    subtitle: "co-located with Perlmutter · sbatch is a tool call, not a network request.",
    tone: "base",
  },
  {
    label: "remote control",
    subtitle: "from my phone · from the playground · from a café.",
    tone: "base",
  },
  {
    label: "me",
    subtitle: "the taste. the questions. the timing.",
    tone: "crown",
  },
];

export function EasterWhyPossible() {
  const reversed = [...LAYERS].reverse();

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
                  <div className="flex items-baseline gap-4">
                    <div className={`font-mono text-[10px] tabular-nums ${layer.tone === "crown" ? "text-amber-300/80" : "text-sky-300/60"}`}>
                      {String(idxFromBottom + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1">
                      <div className={`font-serif text-[clamp(17px,1.5vw,22px)] leading-tight ${layer.tone === "crown" ? "text-amber-200 italic" : "text-zinc-100"}`}>
                        {layer.label}
                      </div>
                      <div className="mt-1 text-[12.5px] text-zinc-400 font-mono leading-snug">
                        {layer.subtitle}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="font-serif italic text-zinc-300 text-[clamp(18px,1.55vw,26px)] leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9, delay: 2.6 } }}
        >
          <p>Claude didn&rsquo;t get lucky.</p>
          <p className="mt-3 text-zinc-400">The stack caught it.</p>

          <motion.p
            className="mt-8 not-italic font-sans text-zinc-300 text-[14px] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8, delay: 3.4 } }}
          >
            Years of pipeline work, good tests, HPC access, and a remote-control loop. The model sits on top. The <span className="text-amber-300">taste</span> sits above that.
          </motion.p>

          <motion.p
            className="mt-5 not-italic font-sans text-zinc-500 text-[13px] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8, delay: 4.1 } }}
          >
            If you want this in your group, invest in the bottom layers. The top layer is already there — it&rsquo;s you.
          </motion.p>
        </motion.div>
      </div>
    </EasterShell>
  );
}
