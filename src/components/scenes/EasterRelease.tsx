"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

const INSTITUTIONS = [
  "CERN", "LBNL", "NBI", "ETH", "Cornell", "UW", "LMU", "IJCLab",
  "L2IT", "UChicago", "Argonne", "SLAC", "FNAL", "DESY", "Kyoto", "Tokyo",
];

export function EasterRelease() {
  return (
    <EasterShell
      beat={1}
      headline="ColliderML goes public."
      hint={<>release · late 2025<br />open particle-tracking dataset</>}
    >
      <div className="relative w-full max-w-[1100px] h-[420px]">
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[11px] tracking-[0.3em] uppercase text-sky-300/90 px-3 py-2 border border-sky-300/40 rounded-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
        >
          ColliderML · open dataset
        </motion.div>
        {INSTITUTIONS.map((name, i) => {
          const angle = (i / INSTITUTIONS.length) * Math.PI * 2;
          const r = 200 + (i % 3) * 30;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r * 0.55;
          return (
            <motion.div
              key={name}
              className="absolute left-1/2 top-1/2 font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded-sm"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: 0.85,
                x,
                y,
                transition: { duration: 1.2, delay: 0.4 + i * 0.07, ease: [0.2, 0.8, 0.3, 1] },
              }}
            >
              {name}
            </motion.div>
          );
        })}
      </div>
    </EasterShell>
  );
}
