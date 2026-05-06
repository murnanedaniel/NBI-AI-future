"use client";

import { motion } from "motion/react";

// Three concentric near-full loops, each with a single arrowhead at one
// end, rotating infinitely at different periods:
//   inner  — task-level     (~3 s/rev, fastest)
//   middle — project-level  (~6 s/rev)
//   outer  — programme/career (~12 s/rev, slowest)
//
// Labels (verbs) sit outside each arc — placement keeps them clear of
// adjacent loops:
//   inner  → label to the right
//   middle → label to the left
//   outer  → label below
//
// Step gating:
//   step 0 → only inner visible
//   step 1 → inner + middle
//   step 2 → all three

type LoopSpec = {
  radius: number;
  period: number;       // seconds per full rotation
  stroke: string;
  width: number;
  title: string;
  verbs: string;
  // Single box per loop containing title + verbs, rendered via
  // <foreignObject> so we can wrap text and apply a frosted background.
  labelBox: { x: number; y: number; w: number; h: number; align: "left" | "right" | "center" };
  step: 0 | 1 | 2;
};

// Colours come from theme-aware CSS variables defined in globals.css —
// `--ink-strong` / `--ink-mute` invert correctly when wrapped in `theme-light`.
// For the loop strokes we pick palette colours that read on both bg's.
const LOOP_DARK_COLORS = ["#7dd3fc", "#fbbf24", "#a78bfa"] as const;   // sky / amber / violet
const LOOP_LIGHT_COLORS = ["#0369a1", "#b45309", "#7c3aed"] as const;  // deeper variants

function buildLoops(palette: readonly string[]): LoopSpec[] {
  return [
    {
      radius: 95,
      period: 2,
      stroke: palette[0],
      width: 2.5,
      title: "task",
      verbs: "reconstruct · classify · regress · identify · cluster · sharpen · reject · trigger · flag",
      // viewBox right edge is x=360. Inner labelBox sits to the right of inner arc.
      labelBox: { x: 130, y: -32, w: 230, h: 150, align: "left" },
      step: 0,
    },
    {
      radius: 175,
      period: 6,
      stroke: palette[1],
      width: 2.5,
      title: "project",
      verbs: "code · document · run · compile · organise · analyse",
      // viewBox left edge is x=-360. Middle labelBox sits to the left of middle arc.
      labelBox: { x: -360, y: -32, w: 150, h: 160, align: "right" },
      step: 1,
    },
    {
      radius: 255,
      period: 18,
      stroke: palette[2],
      width: 2.5,
      title: "programme & career",
      verbs: "ideate · plan · collaborate · teach · publish",
      labelBox: { x: -350, y: 290, w: 700, h: 80, align: "center" },
      step: 2,
    },
  ];
}

// Build a near-full arc path (sweep ~340°) with a small gap where the
// arrowhead lives. Arc starts at angle gapEnd (deg) and ends at gapStart.
function arcPath(radius: number, gapDeg = 18) {
  // Place the gap at angle 0° (3 o'clock position). Arc goes clockwise
  // from angle (gapDeg/2) all the way around to (-gapDeg/2 + 360).
  const half = gapDeg / 2;
  const startDeg = half;
  const endDeg = 360 - half;
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  // large-arc-flag = 1 (sweep > 180°), sweep-flag = 1 (clockwise)
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 1 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

type Props = { step: number; theme?: "dark" | "light"; hideHeadline?: boolean };

export function LoopsViz({ step, theme = "dark", hideHeadline = false }: Props) {
  const isLight = theme === "light";
  const palette = isLight ? LOOP_LIGHT_COLORS : LOOP_DARK_COLORS;
  const LOOPS = buildLoops(palette);

  const titleColor = isLight ? "#141414" : "#f4f4f5";
  const verbsColor = isLight ? "#4b4b4b" : "#a1a1aa";
  const dotColor   = isLight ? "#525252" : "#e4e4e7";

  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden vignette ${isLight ? "theme-light" : ""}`}
      style={isLight ? { backgroundColor: "var(--canvas)" } : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="-360 -360 720 720"
          className="w-[min(85vh,860px)] h-[min(85vh,860px)]"
        >
          <defs>
            {LOOPS.map((loop) => (
              <marker
                key={`arrow-${loop.title}`}
                id={`arrow-${loop.title.replace(/\s+/g, "-")}-${theme}`}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={loop.stroke} />
              </marker>
            ))}
          </defs>

          {LOOPS.map((loop) => {
            const visible = step >= loop.step;
            return (
              <motion.g
                key={loop.title}
                initial={{ rotate: 0, opacity: 0, scale: 0.92 }}
                animate={{
                  rotate: 360,
                  opacity: visible ? 1 : 0,
                  scale: visible ? 1 : 0.92,
                }}
                transition={{
                  rotate: { duration: loop.period, ease: "linear", repeat: Infinity },
                  opacity: { duration: 0.7 },
                  scale: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                <path
                  d={arcPath(loop.radius)}
                  fill="none"
                  stroke={loop.stroke}
                  strokeWidth={loop.width}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${loop.title.replace(/\s+/g, "-")}-${theme})`}
                />
              </motion.g>
            );
          })}

          {/* Static labels — title + verbs in a frosted-glass card so the
              text reads cleanly over the rotating arrows. */}
          {LOOPS.map((loop) => {
            const visible = step >= loop.step;
            const bg = isLight ? "rgba(246,241,231,0.72)" : "rgba(15,17,22,0.55)";
            return (
              <motion.g
                key={`lab-${loop.title}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: visible ? 1 : 0, transition: { duration: 0.6, delay: 0.15 } }}
              >
                <foreignObject
                  x={loop.labelBox.x}
                  y={loop.labelBox.y}
                  width={loop.labelBox.w}
                  height={loop.labelBox.h}
                >
                  <div
                    style={{
                      display: "inline-block",
                      maxWidth: "100%",
                      padding: "8px 12px",
                      background: bg,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderRadius: "8px",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.06)"
                        : "1px solid rgba(255,255,255,0.06)",
                      textAlign: loop.labelBox.align as "left" | "right" | "center",
                      boxSizing: "border-box",
                      // Push the box to the correct side within the foreignObject:
                      float: loop.labelBox.align === "right"
                        ? "right"
                        : loop.labelBox.align === "center"
                          ? "none"
                          : "left",
                      marginLeft: loop.labelBox.align === "center" ? "auto" : undefined,
                      marginRight: loop.labelBox.align === "center" ? "auto" : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        fontSize: "22px",
                        color: loop.stroke,
                        lineHeight: 1.05,
                      }}
                    >
                      {loop.title}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "12px",
                        letterSpacing: "0.04em",
                        lineHeight: 1.5,
                        color: verbsColor,
                      }}
                    >
                      {loop.verbs}
                    </div>
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}

          {/* Anchor dot at centre */}
          <circle cx="0" cy="0" r="3" fill={dotColor} opacity="0.55" />
        </svg>
      </div>

      {/* Optional floating headline at top — only visible at step 2 */}
      {step >= 2 && !hideHeadline && (
        <motion.div
          className="absolute top-12 left-1/2 -translate-x-1/2 font-serif italic text-center"
          style={{ color: titleColor }}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.4 } }}
        >
          <span className="text-[clamp(20px,2vw,32px)]">three loops, one researcher.</span>
        </motion.div>
      )}
    </motion.div>
  );
}
