"use client";

import { motion, useMotionValue, useTransform, animate, type MotionValue } from "motion/react";
import { useEffect } from "react";

// Sequence:
//   t=0      : "April 2026" card centered, large (scale 1.4)
//   t=0.6s   : card shrinks to scale 0.85
//   t=0.6s→6.2s : strip whizzes right→left, 24 month-cards whip through
//   t=6.2s→7.4s : "April 2028" card centered, grows to scale 1.2
// Background interpolates dark → cream over the whole arc.
// Total ~ 7.4 s — fits in the 8-s scene budget.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const START = { monthIdx: 3, year: 2026 }; // April 2026
const TOTAL_STEPS = 24;                    // 24 transitions → April 2028
const N_CARDS = TOTAL_STEPS + 1;           // 25 cards inclusive
const CARD_W = 320;                        // px
const CARD_GAP = 18;                       // px
const STRIDE = CARD_W + CARD_GAP;
const DURATION = 7.4;

function monthAtOffset(offset: number) {
  const idx = (START.monthIdx + offset) % 12;
  const yearOffset = Math.floor((START.monthIdx + offset) / 12);
  return { month: MONTHS[idx], year: START.year + yearOffset };
}

const CARDS = Array.from({ length: N_CARDS }, (_, i) => monthAtOffset(i));

export function CalendarFlip() {
  // Single 0..1 driver; everything else is a useTransform on this.
  const phase = useMotionValue(0);

  useEffect(() => {
    const ctrl = animate(phase, 1, { duration: DURATION, ease: [0.42, 0, 0.45, 1] });
    return () => ctrl.stop();
  }, [phase]);

  // currentIdx: 0 → 24 (i.e. which card is centered).
  // Hold at 0 during shrink window (0 → 0.08), advance through the whiz
  // window (0.08 → 0.84), settle at 24.
  const currentIdx = useTransform(
    phase,
    [0, 0.08, 0.84, 1],
    [0, 0, TOTAL_STEPS, TOTAL_STEPS],
  );

  // Card scale: 1.4 → 0.85 during shrink, hold during whiz, → 1.2 at end.
  const scale = useTransform(
    phase,
    [0, 0.06, 0.10, 0.84, 0.93, 1],
    [1.4, 1.4, 0.85, 0.85, 1.2, 1.2],
  );

  // Theme colours interpolating dark → cream.
  const bg         = useTransform(phase, [0, 1], ["#050607", "#f6f1e7"]);
  const cardBg     = useTransform(phase, [0, 1], ["#18181b", "#fbf6ec"]);
  const textColor  = useTransform(phase, [0, 1], ["#f4f4f5", "#141414"]);
  const muted      = useTransform(phase, [0, 1], ["#71717a", "#6b6b6b"]);
  const borderClr  = useTransform(phase, [0, 1], ["rgba(255,255,255,0.08)", "rgba(20,20,20,0.12)"]);

  // Ambient label fades out as we near the destination.
  const labelOpacity = useTransform(phase, [0, 0.05, 0.85, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: bg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* ambient label */}
      <motion.div
        className="absolute top-12 left-1/2 -translate-x-1/2 font-mono text-[12px] tracking-[0.35em] uppercase"
        style={{ color: muted, opacity: labelOpacity }}
      >
        thinking forward...
      </motion.div>

      {/* card strip — each card is positioned relative to its index, with the
          strip offset by -currentIdx * STRIDE so the active card sits at center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          style={{ scale, width: 0, height: 0 }}
        >
          {CARDS.map((c, i) => (
            <CalendarCard
              key={`${c.month}-${c.year}`}
              i={i}
              month={c.month}
              year={c.year}
              currentIdx={currentIdx}
              cardBg={cardBg}
              textColor={textColor}
              borderClr={borderClr}
              muted={muted}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

type CardProps = {
  i: number;
  month: string;
  year: number;
  currentIdx: MotionValue<number>;
  cardBg: MotionValue<string>;
  textColor: MotionValue<string>;
  borderClr: MotionValue<string>;
  muted: MotionValue<string>;
};

function CalendarCard({
  i, month, year, currentIdx, cardBg, textColor, borderClr, muted,
}: CardProps) {
  // Each card's screen-x = (i - currentIdx) * STRIDE.
  // Built with a useTransform so it tracks currentIdx live.
  const x = useTransform(currentIdx, (c) => (i - c) * STRIDE);
  // Fade cards that are far from center so the off-screen ones don't
  // distract — peak opacity at offset 0, drops sharply past ±1.5.
  const opacity = useTransform(currentIdx, (c) => {
    const d = Math.abs(i - c);
    if (d < 0.6) return 1;
    if (d > 2.5) return 0;
    return Math.max(0, 1 - (d - 0.6) * 0.6);
  });

  return (
    <motion.div
      className="absolute rounded-lg flex flex-col items-center justify-center font-serif"
      style={{
        left: -CARD_W / 2,
        top: -CARD_W * 0.6,
        width: CARD_W,
        height: CARD_W * 1.2,
        x,
        opacity,
        backgroundColor: cardBg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: borderClr,
        boxShadow: "0 22px 50px -18px rgba(0,0,0,0.5), 0 6px 16px -8px rgba(0,0,0,0.35)",
      }}
    >
      <motion.div
        className="font-mono uppercase tracking-[0.35em] text-[11px] mb-3"
        style={{ color: muted }}
      >
        {year}
      </motion.div>
      <motion.div
        className="italic text-center"
        style={{
          color: textColor,
          fontSize: "clamp(40px, 5.5vw, 92px)",
          lineHeight: 1.05,
        }}
      >
        {month}
      </motion.div>
    </motion.div>
  );
}
