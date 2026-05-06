"use client";

import { motion, AnimatePresence } from "motion/react";

const SHARED_LABELS = [
  "Study",
  "Experiment",
  "Analysis",
  "Literature review",
  "Code",
  "Talk",
];

const PHD_POSITIONS: { top: string; left: string }[] = [
  { top: "12%", left: "14%" },
  { top: "20%", left: "62%" },
  { top: "44%", left: "30%" },
  { top: "62%", left: "70%" },
  { top: "70%", left: "12%" },
  { top: "32%", left: "82%" },
];

const AGENT_POSITIONS: { top: string; left: string }[] = [
  { top: "18%", left: "60%" },
  { top: "30%", left: "16%" },
  { top: "52%", left: "62%" },
  { top: "68%", left: "26%" },
  { top: "12%", left: "30%" },
  { top: "78%", left: "70%" },
];

const NEW_PROJECTS = [
  "Large-scale Meta-analysis",
  "20 experiments across the theory space",
  "Dataset campaign",
  "Long-horizon literature synthesis",
  "Cross-domain reproducibility study",
];

const AGENT_GRID_COUNT = 20;

// PhD box scale across the 4 steps:
//   step 0: hidden
//   step 1: full size (1.0)
//   step 2: shrinks alongside multiplier ticks (animated keyframes inside the box)
//   step 3: expands back full + houses agents
// Agent box scale:
//   step 0: hidden
//   step 1: full size
//   step 2: full size
//   step 3: shrinks to small cell, clones into 4×5 grid inside PhD
function ScatteredLabel({
  label,
  pos,
  delay,
  active,
}: {
  label: string;
  pos: { top: string; left: string };
  delay: number;
  active: boolean;
}) {
  return (
    <motion.div
      className="absolute font-mono text-[12px] md:text-[13px] text-ink/75 whitespace-nowrap pointer-events-none"
      style={{ top: pos.top, left: pos.left }}
      initial={{ opacity: 0, y: 4 }}
      animate={
        active
          ? {
              opacity: [0, 1, 1, 0],
              y: [4, 0, 0, -2],
              transition: {
                duration: 1.8,
                delay,
                times: [0, 0.2, 0.75, 1],
                repeat: Infinity,
                repeatDelay: 2.4,
              },
            }
          : { opacity: 0 }
      }
    >
      {label}
    </motion.div>
  );
}

export function PhDPedagogy({ step }: { step: number }) {
  const showBoxes = step >= 1;
  const showAgentInsidePhd = step >= 3;

  // PhD box scale: 1 at step 1, animates 1 → 0.7 → 0.45 → 0.25 across the
  // step-2 keyframes, then jumps back to 1.15 at step 3.
  const phdScaleAnimate =
    step === 2
      ? { scale: [1.0, 0.7, 0.45, 0.25] }
      : step >= 3
        ? { scale: 1.15 }
        : { scale: 1.0 };

  const phdScaleTransition =
    step === 2
      ? { duration: 9, times: [0, 0.33, 0.66, 1], ease: "easeInOut" as const }
      : { duration: 0.9, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  // Agent box scale: stays 1 in steps 1+2, shrinks at step 3.
  const agentScale = step >= 3 ? 0 : 1;

  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-10 gap-8">
        {/* Top caption (step-aware) */}
        <div className="h-[80px] flex items-end justify-center">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="up-at-night"
                className="font-serif italic text-ink text-[clamp(28px,3.0vw,46px)] text-center leading-tight"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                this keeps me up at night.
              </motion.div>
            )}
            {step === 1 && (
              <motion.div
                key="question"
                className="font-serif italic text-ink text-[clamp(20px,2.0vw,32px)] text-center leading-tight max-w-[1000px]"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                what does project-based pedagogy look like<br/>
                when a human takes <em className="text-ink">2×</em> as long as the agent?
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="multipliers"
                className="font-serif italic text-ink text-[clamp(22px,2.2vw,34px)] text-center leading-tight"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                5×?  100×?
              </motion.div>
            )}
            {step >= 3 && (
              <motion.div
                key="raise-bar"
                className="font-serif italic text-ink text-[clamp(22px,2.2vw,34px)] text-center leading-tight"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                raise the bar.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Two blocks */}
        <div className="flex flex-row items-center justify-center gap-12 md:gap-20">
          {/* LEFT - PhD block */}
          <motion.div
            className="relative w-[400px] h-[300px] md:w-[440px] md:h-[330px] rounded-2xl border-2 border-sky-600/55 bg-paper ink-shadow"
            initial={{ opacity: 0, y: 12, scale: 1 }}
            animate={
              showBoxes
                ? { opacity: 1, y: 0, ...phdScaleAnimate, transition: { ...phdScaleTransition, opacity: { duration: 0.5 } } }
                : { opacity: 0, y: 12, scale: 1 }
            }
            style={{ transformOrigin: "center center" }}
          >
            <div className="absolute -top-9 left-0 right-0 text-center font-serif text-sky-700 text-[clamp(28px,2.6vw,40px)] leading-none">
              PhD
            </div>

            {/* step 1+2: scattered labels inside */}
            {(step === 1 || step === 2) && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {SHARED_LABELS.map((label, i) => (
                  <ScatteredLabel
                    key={`phd-${label}`}
                    label={label}
                    pos={PHD_POSITIONS[i]}
                    delay={i * 0.35}
                    active={true}
                  />
                ))}
              </div>
            )}

            {/* step 3+: 20 agent cells fill the inside */}
            {showAgentInsidePhd && (
              <div className="absolute inset-3 grid grid-cols-5 grid-rows-4 gap-1.5">
                {Array.from({ length: AGENT_GRID_COUNT }).map((_, i) => (
                  <motion.div
                    key={`cell-${i}`}
                    className="rounded-[4px] border border-amber-500/55 bg-paper/80"
                    initial={{ opacity: 0, x: 320, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        duration: 0.7,
                        delay: 0.6 + (i % 5) * 0.05 + Math.floor(i / 5) * 0.04,
                        ease: "easeOut",
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* RIGHT - Agent block */}
          <motion.div
            className="relative w-[400px] h-[300px] md:w-[440px] md:h-[330px] rounded-2xl border-2 border-amber-500/55 bg-paper ink-shadow"
            initial={{ opacity: 0, y: 12, scale: 1 }}
            animate={
              showBoxes
                ? {
                    opacity: agentScale === 0 ? 0 : 1,
                    y: 0,
                    scale: agentScale,
                    transition: { duration: 0.7, delay: 0.4 },
                  }
                : { opacity: 0, y: 12, scale: 1 }
            }
            style={{ transformOrigin: "center center" }}
          >
            <div className="absolute -top-9 left-0 right-0 text-center font-serif text-amber-700 text-[clamp(28px,2.6vw,40px)] leading-none">
              Agent
            </div>

            {(step === 1 || step === 2) && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {SHARED_LABELS.map((label, i) => (
                  <ScatteredLabel
                    key={`agent-${label}`}
                    label={label}
                    pos={AGENT_POSITIONS[i]}
                    delay={i * 0.35 + 0.18}
                    active={true}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* step 0 sublabel — empty placeholder so layout doesn't jump */}
        <div className="h-[40px]" />

        {/* step 3+: floating new project labels (rendered as overlay, doesn't shift layout) */}
        {step >= 3 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-[1100px] h-full">
              {NEW_PROJECTS.map((p, i) => {
                const positions = [
                  { top: "10%", left: "8%" },
                  { top: "16%", right: "6%" },
                  { bottom: "22%", left: "4%" },
                  { bottom: "12%", right: "10%" },
                  { top: "50%", left: "50%" },
                ];
                const pos = positions[i] ?? { top: "50%", left: "50%" };
                const isCenter = i === 4;
                return (
                  <motion.div
                    key={p}
                    className={`absolute font-serif italic text-ink leading-tight ${
                      isCenter
                        ? "text-[clamp(18px,1.8vw,26px)] -translate-x-1/2 -translate-y-1/2"
                        : "text-[clamp(16px,1.5vw,22px)]"
                    }`}
                    style={pos}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.8, delay: 1.4 + i * 0.35 },
                    }}
                  >
                    {p}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
