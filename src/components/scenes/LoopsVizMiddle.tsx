"use client";

import { motion } from "motion/react";
import { LoopsViz } from "./LoopsViz";

// Two-beat scene that bridges from InnerLoopHistory back to a rotating
// loop, then adds the middle loop. The "What does publication / collaboration
// look like" framing comes much later — not in this scene.
//   step 0 — return to inner-only (loop is back, breath beat).
//   step 1 — middle loop joins.
export function LoopsVizMiddle({ step = 0 }: { step?: number }) {
  const innerStep = step >= 1 ? 1 : 0;
  return (
    <div className="absolute inset-0">
      <LoopsViz step={innerStep} />
    </div>
  );
}
