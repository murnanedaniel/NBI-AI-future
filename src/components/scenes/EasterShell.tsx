"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  beat: number;
  children: ReactNode;
  headline?: ReactNode;
  hint?: ReactNode;
  align?: "center" | "top";
};

export function EasterShell({ beat, children, headline, hint, align = "center" }: Props) {
  return (
    <motion.div
      className="absolute inset-0 canvas-grid vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.7 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">
              Act 2 · Easter beamspot study · {beat}/9
            </div>
            {headline && (
              <div className="mt-2 text-[clamp(26px,3.3vw,44px)] font-serif italic text-zinc-100 leading-tight max-w-[780px]">
                {headline}
              </div>
            )}
          </div>
          {hint && (
            <div className="font-mono text-[11px] text-zinc-500 text-right tabular-nums">{hint}</div>
          )}
        </div>
        <div className={`flex-1 flex ${align === "center" ? "items-center" : "items-start pt-8"} justify-center`}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
