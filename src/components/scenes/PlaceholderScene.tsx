"use client";

import { motion } from "motion/react";
import type { SceneId } from "@/lib/timeline";

type Props = { id: SceneId; label: string; act: 1 | 2 | 3 | 4 };

export function PlaceholderScene({ id, label, act }: Props) {
  return (
    <motion.div
      className="absolute inset-0 canvas-grid vignette flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className="text-center max-w-2xl px-8">
        <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act {act}</div>
        <div className="mt-3 text-[clamp(36px,5vw,72px)] font-serif italic text-zinc-100 leading-tight">
          {label}
        </div>
        <div className="mt-6 font-mono text-[11px] text-zinc-600">scene: {id}</div>
        <div className="mt-2 text-zinc-500 text-sm">
          placeholder — will be built once the script draft lands
        </div>
      </div>
    </motion.div>
  );
}
