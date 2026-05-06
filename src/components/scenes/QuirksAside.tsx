"use client";

import { AnimatePresence, motion } from "motion/react";
import { LoopsViz } from "./LoopsViz";
import { asset } from "@/lib/asset";

// One-shot aside during Para 3:
// "We have shown for example that the exact same model can be trained to
// find standard model particles, or trained to find very strange BSM
// trajectories like 'quirks', which are highly non-helical."
//
// Step 0 — quirks plot + caption.
// Step 1 — return to the inner loop (per Daniel's request: "After quirks,
//          show the inner loop again"). Holds until next click advances
//          to InnerLoopHistory.

export function QuirksAside({ step = 0 }: { step?: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden vignette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.7 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <AnimatePresence mode="wait">
        {step <= 0 ? (
          <motion.div
            key="quirks"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div
              className="font-serif italic text-zinc-300 text-[clamp(18px,1.6vw,28px)] leading-snug max-w-[820px] text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } }}
            >
              same model, different physics —
              <span className="text-amber-300/90"> standard tracks</span>,
              or <span className="text-rose-300/90">quirks</span>:
              <span className="block text-zinc-400 text-[clamp(15px,1.2vw,22px)] mt-1">
                highly non-helical, oscillating in a plane.
              </span>
            </motion.div>

            <motion.img
              src={asset("/img/quirks_fig1.png")}
              alt="Quirky tracks (arXiv 2410.00269 fig 1)"
              className="max-h-[60vh] w-auto rounded-md shadow-2xl border border-white/10"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.4 } }}
            />

            <motion.div
              className="font-mono text-[10px] tracking-wider uppercase text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, delay: 1.0 } }}
            >
              Murnane et al. · arXiv 2410.00269 · Exa.TrkX adapted for non-helical BSM tracks
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="back-to-inner"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.7 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <LoopsViz step={0} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
