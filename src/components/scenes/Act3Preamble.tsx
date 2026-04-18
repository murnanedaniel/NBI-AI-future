"use client";

import { motion } from "motion/react";

type Stage = {
  era: string;
  label: string;
  descriptor: string;
  state: "past" | "now" | "projected";
};

const STAGES: Stage[] = [
  { era: "a year ago", label: "bachelor's student",              descriptor: "follows scoped code tasks", state: "past" },
  { era: "today",      label: "master's — probably 2nd-year PhD", descriptor: "runs multi-day investigations", state: "now" },
  { era: "~2027",      label: "postdoctoral researcher",          descriptor: "frames the question itself", state: "projected" },
];

export function Act3Preamble() {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <motion.div
          className="text-ink/55 font-serif italic text-[clamp(16px,1.5vw,24px)]"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } }}
        >
          if your science is mostly computational —
        </motion.div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative grid grid-cols-3 gap-8 max-w-[1240px] w-full">
            <svg
              className="absolute left-0 right-0 top-full pointer-events-none"
              viewBox="0 0 1240 90"
              preserveAspectRatio="none"
              height="90"
              style={{ marginTop: "12px" }}
            >
              <motion.path
                d="M 160 70 C 460 70, 620 55, 620 45 S 900 20, 1080 18"
                fill="none"
                stroke="#141414"
                strokeOpacity="0.3"
                strokeWidth="1.4"
                strokeDasharray="3 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, transition: { duration: 2.2, delay: 1.3 } }}
              />
              <motion.circle
                cx="1080" cy="18" r="4" fill="#0369a1"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 3.4 } }}
              />
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.6, delay: 3.7 } }}
              >
                <text x="1095" y="22" fontSize="11" fill="#0369a1" fontFamily="var(--font-geist-mono)">▸</text>
              </motion.g>
            </svg>

            {STAGES.map((s, i) => (
              <motion.div
                key={s.era}
                className={`relative rounded-md p-6 flex flex-col gap-3 min-h-[170px] ${
                  s.state === "projected"
                    ? "border border-dashed border-ink/35 bg-transparent"
                    : s.state === "past"
                    ? "border border-ink/10 bg-paper/60"
                    : "border border-ink/15 bg-paper ink-shadow"
                }`}
                initial={{ opacity: 0, y: 18 }}
                animate={{
                  opacity: s.state === "past" ? 0.6 : 1,
                  y: 0,
                  transition: { duration: 0.65, delay: 0.5 + i * 0.5 },
                }}
              >
                <div className="font-mono text-[11px] text-ink/50 uppercase tracking-wider">{s.era}</div>
                <div
                  className={`font-serif text-ink leading-tight ${
                    s.state === "now" ? "text-[clamp(22px,2.2vw,32px)] italic" : "text-[clamp(18px,1.75vw,26px)] italic"
                  }`}
                >
                  {s.label}
                </div>
                <div className="font-sans text-[13px] text-ink/65 leading-snug mt-auto">
                  {s.descriptor}
                </div>

                {s.state === "projected" && (
                  <motion.div
                    className="absolute top-4 right-4 font-mono text-[9px] uppercase tracking-wider text-ink/45"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 1.8 + i * 0.5 } }}
                  >
                    projected
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 pb-4">
          <motion.div
            className="font-serif italic text-ink/55 text-[clamp(15px,1.3vw,20px)] text-center max-w-[760px] leading-snug"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.9, delay: 3.9 } }}
          >
            not because the models get better —<br />
            because we get better at using them.
          </motion.div>

          <motion.div
            className="font-serif italic text-ink text-[clamp(24px,2.6vw,44px)] text-center leading-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.1, delay: 5.0 } }}
          >
            so what does your day look like?
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
