"use client";

import { motion } from "motion/react";
import { asset } from "@/lib/asset";

const TRANSCRIPT = [
  "[move beamline]",
  "[different baselines]",
  "[generalisation]",
  "[global fitting]",
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-[82vh] rounded-[40px] border-[10px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
      style={{ aspectRatio: "9 / 19" }}
    >
      <div className="absolute inset-0 rounded-[32px] bg-zinc-950 overflow-hidden">
        {/* notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-black z-20" />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ time = "09:14" }: { time?: string }) {
  return (
    <div className="relative h-7 flex items-center justify-between px-6 pt-1 text-[11px] font-mono text-zinc-300 z-10">
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-[10px]">•••</span>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
          <rect x="0" y="6" width="2" height="4" />
          <rect x="3" y="4" width="2" height="6" />
          <rect x="6" y="2" width="2" height="8" />
          <rect x="9" y="0" width="2" height="10" />
        </svg>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="0.5" y="0.5" width="14" height="9" rx="1.5" />
          <rect x="2" y="2" width="9" height="6" fill="currentColor" />
          <rect x="15" y="3" width="2" height="4" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[2.5px] rounded-full bg-emerald-400/80"
          initial={{ height: 4 }}
          animate={
            active
              ? {
                  height: [4, 6 + ((i * 7) % 22), 4 + ((i * 5) % 14), 8 + ((i * 3) % 18), 4],
                }
              : { height: 4 }
          }
          transition={
            active
              ? {
                  duration: 1.4 + (i % 5) * 0.15,
                  repeat: Infinity,
                  delay: (i * 0.04) % 0.4,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export function RorvigRunPhone({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-zinc-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      <div className="relative h-full flex flex-col items-center justify-center py-6 gap-3">
        <motion.div
          className="w-auto h-full max-h-[82vh]"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.9, ease: "easeOut" } }}
        >
          <PhoneFrame>
            <StatusBar time="09:14" />

            {/* Map - top ~58% */}
            <div className="relative mx-3 mt-1 h-[55%] rounded-2xl overflow-hidden border border-white/5">
              <motion.img
                src={asset("/img/rorvigrun.png")}
                alt="Rorvig run map"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.9, delay: 0.4 } }}
              />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between font-mono text-[10px] text-white/90 drop-shadow-md">
                <span>5.02 km</span>
                <span>25 min</span>
                <span>04 Apr</span>
              </div>
            </div>

            {/* Audio memo card */}
            <motion.div
              className="mx-3 mt-3 rounded-2xl bg-zinc-900 border border-white/5 p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-400">
                  Rørvig run · plan
                </span>
                <span className="font-mono text-[9px] text-zinc-500">voice memo</span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <span className="text-emerald-300 text-[11px]">▶</span>
                </div>
                <div className="flex-1">
                  <Waveform active={step >= 1} />
                </div>
              </div>

              <div className="mt-2 font-mono text-[9px] text-zinc-500">
                Sat Apr 4 · 09:14
              </div>

              {/* Transcript bullets */}
              <div className="mt-3 space-y-1.5 min-h-[80px]">
                {TRANSCRIPT.map((phrase, i) => (
                  <motion.div
                    key={phrase}
                    className="font-mono text-[10.5px] text-zinc-200"
                    initial={{ opacity: 0, x: -6 }}
                    animate={
                      step >= 1
                        ? { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.4 + i * 2.0 } }
                        : { opacity: 0, x: -6 }
                    }
                  >
                    <span className="text-emerald-400/70 mr-1.5">·</span>
                    {phrase}
                  </motion.div>
                ))}
              </div>

              {/* Send bubble */}
              <motion.div
                className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  step >= 2
                    ? { opacity: 1, scale: 1, transition: { duration: 0.5 } }
                    : { opacity: 0, scale: 0.9 }
                }
              >
                <motion.div
                  className="font-mono text-[10px] text-sky-300 bg-sky-500/10 border border-sky-400/30 rounded-full px-3 py-1"
                  animate={
                    step >= 2
                      ? { scale: [1, 1.08, 1], transition: { duration: 0.8, repeat: 2 } }
                      : {}
                  }
                >
                  → sent to Claude · 14:08
                </motion.div>
              </motion.div>
            </motion.div>
          </PhoneFrame>
        </motion.div>

        <motion.div
          className="font-serif italic text-zinc-500 text-[13px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, delay: 1.0 } }}
        >
          5.02 km · 25 min · while she napped
        </motion.div>
      </div>
    </motion.div>
  );
}
