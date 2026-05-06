"use client";

import { motion } from "motion/react";

const RC_CHAT_TBD = [
  { role: "claude", text: "TBD: 1st claude message" },
  { role: "daniel", text: "TBD: 1st daniel reply" },
  { role: "claude", text: "TBD: 2nd claude message" },
  { role: "daniel", text: "TBD: 2nd daniel reply" },
];
const RC_NOTIF_TBD = "Claude · sweep complete · d₀ 0.018 mm";
const RC_TIMESTAMPS_TBD = [
  "Fri 19:42",
  "Sat 09:14",
  "Sat 14:08",
  "Sun 07:14",
  "Sun 11:02",
  "Sun 14:33",
  "Mon 06:48",
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-[82vh] rounded-[40px] border-[10px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
      style={{ aspectRatio: "9 / 19" }}
    >
      <div className="absolute inset-0 rounded-[32px] bg-zinc-950 overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-black z-30" />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ time = "11:02" }: { time?: string }) {
  return (
    <div className="relative h-7 flex items-center justify-between px-6 pt-1 text-[11px] font-mono text-zinc-300 z-10">
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
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

function Bubble({ role, text, delay }: { role: string; text: string; delay: number }) {
  const isClaude = role === "claude";
  return (
    <motion.div
      className={`flex ${isClaude ? "justify-start" : "justify-end"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay } }}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 font-mono text-[11px] leading-snug ${
          isClaude
            ? "bg-zinc-800 text-zinc-100 rounded-bl-sm"
            : "bg-sky-700 text-white rounded-br-sm"
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

export function RemoteControlPhone({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-zinc-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      <div className="relative h-full flex items-center justify-center gap-10 md:gap-16 px-8">
        {/* Phone — offset slightly left */}
        <motion.div
          className="relative -translate-x-4 md:-translate-x-10"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.9, ease: "easeOut" } }}
        >
          <PhoneFrame>
            <StatusBar time="11:02" />

            {/* Header bar */}
            <div className="relative mx-3 mt-1 rounded-xl bg-zinc-900 border border-white/5 px-3 py-2 flex items-center gap-2 z-10">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
              <span className="text-amber-300 text-[12px]">☀</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-zinc-200 truncate">Claude Code</div>
                <div className="font-mono text-[9px] text-zinc-500 truncate">easter-beamspot</div>
              </div>
              <div className="font-mono text-[9px] text-zinc-500">live</div>
            </div>

            {/* Notification banner */}
            <motion.div
              className="absolute top-2 left-3 right-3 z-40 rounded-xl bg-zinc-100 text-zinc-900 px-3 py-2 shadow-2xl flex items-center gap-2"
              initial={{ y: -80, opacity: 0 }}
              animate={
                step >= 1
                  ? { y: 0, opacity: 1, transition: { duration: 0.6, delay: 1.5, type: "spring", stiffness: 200, damping: 22 } }
                  : { y: -80, opacity: 0 }
              }
            >
              <span className="text-amber-500 text-[14px]">☀</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">Claude Code · easter-beamspot</div>
                <div className="font-mono text-[10.5px] text-zinc-900 truncate">{RC_NOTIF_TBD}</div>
              </div>
              <div className="font-mono text-[9px] text-zinc-500">now</div>
            </motion.div>

            {/* Chat thread */}
            <div className="mx-3 mt-3 space-y-2 overflow-hidden">
              {RC_CHAT_TBD.map((msg, i) => {
                const visibleAtStep = i < 2 ? 0 : 1;
                const delay = i < 2 ? 0.5 + i * 0.3 : 1.0 + (i - 2) * 1.2;
                return step >= visibleAtStep ? (
                  <Bubble key={i} role={msg.role} text={msg.text} delay={delay} />
                ) : null;
              })}
            </div>
          </PhoneFrame>
        </motion.div>

        {/* Timestamp column */}
        <div className="flex flex-col gap-3 min-w-[120px]">
          <motion.div
            className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-500"
            initial={{ opacity: 0 }}
            animate={
              step >= 2
                ? { opacity: 1, transition: { duration: 0.5 } }
                : { opacity: 0 }
            }
          >
            session pings
          </motion.div>
          {RC_TIMESTAMPS_TBD.map((ts, i) => (
            <motion.div
              key={ts}
              className="font-mono italic text-[12px] text-zinc-500 tabular-nums"
              initial={{ opacity: 0, x: -8 }}
              animate={
                step >= 2
                  ? { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 + i * 0.18 } }
                  : { opacity: 0, x: -8 }
              }
            >
              <span className="text-zinc-700 mr-2">·</span>
              {ts}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
