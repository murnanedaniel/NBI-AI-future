"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

// 16 real PDF pages rendered to public/img/paper/page-NN.png by pdftoppm.
const N_PAGES = 16;
const pageSrc = (i: number) => `/img/paper/page-${String(i + 1).padStart(2, "0")}.png`;

// Pre-computed fan-out positions for the 16 pages — 4 × 4 grid in viewport
// units (px) with deterministic jitter so the layout is stable between
// renders. Page (i=0) lands top-left, page 15 bottom-right.
const FAN: { x: number; y: number; rot: number }[] = (() => {
  const out: { x: number; y: number; rot: number }[] = [];
  // grid spacing in CSS pixels (works in any viewport, scaled by the
  // base width below to keep pages clear of each other).
  const STEP_X = 240;
  const STEP_Y = 295;
  for (let i = 0; i < N_PAGES; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = (col - 1.5) * STEP_X;
    const y = (row - 1.5) * STEP_Y;
    const jx = ((i * 137.508) % 360) / 360 - 0.5;
    const jy = ((i * 211.111) % 360) / 360 - 0.5;
    const rot = jx * 6;
    out.push({ x: x + jx * 8, y: y + jy * 6, rot });
  }
  return out;
})();

export function EasterReveal({ step }: { step: number }) {
  return (
    <EasterShell
      beat={8}
      headline={
        step === 0
          ? "By Monday morning — a paper."
          : step === 1
          ? "Sixteen pages."
          : "Read by experts. Decent first draft."
      }
      align="top"
    >
      <div className="relative w-full max-w-[1400px] h-[68vh]">
        {/* Pages container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: N_PAGES }).map((_, i) => {
            const fan = FAN[i];

            // step 0: a SINGLE large paper fills most of the screen
            //         (16 pages stacked tightly with tiny offsets, scale ~2.5)
            // step 1: shrink + explode — every page visible at scale 1.0
            // step 2: collapse back and grow LARGER than step 0 (scale ~3.2)
            const target =
              step <= 0
                ? { x: i * 1.2, y: i * 0.9, rotate: -1 + (i % 3) * 0.4, scale: 2.5 }
                : step === 1
                ? { x: fan.x, y: fan.y, rotate: fan.rot, scale: 1.0 }
                : {
                    x: i * 1.4,
                    y: i * 1.1,
                    rotate: -1.2 + (i % 3) * 0.5,
                    scale: 3.2,
                  };

            return (
              <motion.div
                key={i}
                className="absolute shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] rounded-sm overflow-hidden bg-paper"
                style={{
                  width: "min(220px, 18vw)",
                  aspectRatio: "1 / 1.295",
                  // Page 1 (title page) always on top — z-order never flips
                  // during transitions.
                  zIndex: N_PAGES - i,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  x: target.x,
                  y: target.y,
                  rotate: target.rotate,
                  scale: target.scale,
                  transition: {
                    duration: step <= 0 ? 0.6 : 1.1,
                    delay: step === 1 ? i * 0.04 : step === 2 ? (N_PAGES - 1 - i) * 0.05 : 0,
                    ease: [0.4, 0, 0.2, 1],
                  },
                }}
              >
                <img src={pageSrc(i)} alt={`page ${i + 1}`} className="w-full h-full object-cover" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom caption — boosted z-index + bg pill so it sits ABOVE the
            scale-3.2 paper grid in step 2 (otherwise papers cover the text). */}
        <motion.div
          className="absolute -bottom-12 left-0 right-0 text-center font-serif italic"
          style={{ zIndex: 100 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.3 } }}
        >
          <span
            className="inline-block px-4 py-2 rounded-md bg-zinc-950/85 backdrop-blur-sm border border-white/10 text-zinc-200 text-[clamp(15px,1.35vw,22px)]"
          >
            {step === 0 && "Apr 7, 2026 · Murnane et al."}
            {step === 1 && "I never looked at the code. I never looked at the raw numbers."}
            {step === 2 && "Suggestions: fix one caption, tweak the conclusion. Otherwise — a decent first draft."}
          </span>
        </motion.div>
      </div>
    </EasterShell>
  );
}
