"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EasterShell } from "./EasterShell";
import easterStream from "@/data/easterStream.json";
import easterSlurm from "@/data/easterSlurm.json";

type Ev = { ts: string; role: "user" | "assistant" | "tool"; text: string };
const EVENTS: Ev[] = (easterStream.events as Ev[]) || [];
// Real sacct totals from Perlmutter, scoped to the Easter window jobs.
const REAL_CPU_H = (easterSlurm as { total_cpu_h: number }).total_cpu_h;
const REAL_GPU_H = (easterSlurm as { total_gpu_h: number }).total_gpu_h;
const REAL_N_JOBS = (easterSlurm as { n_jobs: number }).n_jobs;

// Per-event resource bumps: each bump is a real Perlmutter job whose ID was
// detected at this event's index in the transcript (or, for unmatched jobs,
// distributed across the latter half so totals still sum to the real values).
type Bump = { idx: number; jobid: string; cpu_h: number; gpu_h: number; state: string };
const BUMPS: Bump[] = ((easterSlurm as { bumps?: Bump[] }).bumps ?? []).slice().sort((a, b) => a.idx - b.idx);

// Phase-1 startup lines (faux but plausible — claude code's actual init sequence
// on Perlmutter, anonymised, no live keys).
const STARTUP_LINES: { text: string; color?: string; delay: number }[] = [
  { text: "$ claude --remote-control --workdir /pscratch/sd/d/danieltm/colliderml-dev", color: "text-sky-300", delay: 0.4 },
  { text: "  Connecting to Anthropic API…", color: "text-zinc-400", delay: 1.2 },
  { text: "  Authenticated as danieltm",   color: "text-emerald-400", delay: 1.8 },
  { text: "  Workspace trust: ACCEPTED",   color: "text-emerald-400", delay: 2.2 },
  { text: "",                              color: "",                delay: 2.5 },
  { text: "  Available compute:",                                                                color: "text-zinc-300", delay: 2.7 },
  { text: "    perlmutter-cpu : 32 nodes × 128 cores",                                          color: "text-zinc-400", delay: 2.95 },
  { text: "    perlmutter-gpu : 8 nodes × 4 × A100-80G",                                         color: "text-zinc-400", delay: 3.20 },
  { text: "    budget        : 200 CPU node-hours · 100 GPU node-hours",                         color: "text-zinc-400", delay: 3.45 },
  { text: "",                                                                                    color: "",                delay: 3.7 },
  { text: "  Tools loaded: Bash · Read · Edit · Write · Grep · Glob · Agent · WebSearch · Task", color: "text-zinc-300", delay: 3.95 },
  { text: "  Remote control: ENABLED · scan QR with Claude app to connect",                      color: "text-amber-300", delay: 4.4 },
  { text: "",                                                                                    color: "",                delay: 4.7 },
  { text: "> ready.",                                                                            color: "text-emerald-300", delay: 5.0 },
];

function formatHM(ts: string) {
  const d = new Date(ts);
  const m = d.toLocaleString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
  const t = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${m} · ${t}`;
}

// A small phone frame copy (kept inline to avoid cross-file coupling).
function PhoneFrame({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div
      className={`relative h-[78vh] rounded-[36px] border-[8px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden transition-opacity ${dim ? "opacity-60" : ""}`}
      style={{ aspectRatio: "9 / 19" }}
    >
      <div className="absolute inset-0 rounded-[28px] bg-zinc-950 overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-3 w-16 rounded-full bg-black z-30" />
        {children}
      </div>
    </div>
  );
}

function Bubble({ ev }: { ev: Ev }) {
  if (ev.role === "tool") return null; // phone only shows human conversation
  const isUser = ev.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1.5`}>
      <div
        className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 font-mono text-[10px] leading-snug ${
          isUser
            ? "bg-sky-700 text-white rounded-br-sm"
            : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
        }`}
      >
        {ev.text.length > 200 ? ev.text.slice(0, 200) + "…" : ev.text}
      </div>
    </div>
  );
}

function TerminalLine({ ev, typed, currentIdx, eventIdx }: { ev: Ev; typed: string; currentIdx: number; eventIdx: number }) {
  let prefix = "";
  let color = "text-zinc-300";
  if (ev.role === "user") {
    prefix = "▶ ";
    color = "text-sky-300";
  } else if (ev.role === "assistant") {
    prefix = "◆ ";
    color = "text-emerald-300";
  } else if (ev.role === "tool") {
    prefix = "  ";
    color = "text-amber-300/80";
  }
  const isActive = eventIdx === currentIdx;
  const text = isActive ? typed : ev.text;
  return (
    <div className={`${color} flex gap-2 leading-snug`}>
      <span className="text-zinc-600 tabular-nums shrink-0 w-[110px]">{formatHM(ev.ts)}</span>
      <span className="whitespace-pre-wrap break-words">
        {prefix}{text}
        {isActive && <span className="ml-px inline-block w-[6px] h-[1em] bg-zinc-300 align-baseline animate-pulse" />}
      </span>
    </div>
  );
}

export function EasterDispatch({ step }: { step: number }) {
  // === phase pacing ===
  // step 0: terminal startup only (5 s of staggered lines, no events)
  // step 1: side-by-side, slow event streaming with letter-by-letter typing
  // step 2: resources box visible, still slow streaming
  // step 3: 100x rapid-fire — chunk through whole transcript in ~30 s
  const [eventIdx, setEventIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [resources, setResources] = useState({ cpu: 0, gpu: 0 });
  const stepRef = useRef(step);
  stepRef.current = step;
  // Mirror eventIdx in a ref so the rAF loop can read the *current* value
  // without re-binding the effect (its closure captures `eventIdx` once).
  const eventIdxRef = useRef(0);
  const lastTypedRef = useRef("");

  const TERMINAL_WINDOW = 24;
  const PHONE_WINDOW = 8;
  const termScrollRef = useRef<HTMLDivElement | null>(null);

  // Continuous exponential acceleration: speed multiplier = 1.3^t (t in seconds
  // since streaming began). Base rate is slow (≈40 chars/sec) so the first
  // events read normally. Past ~15 s, multiplier > 50× and we abandon
  // letter-by-letter typing in favour of chunk-advance.
  const streamStartRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let alive = true;
    let lastTime = performance.now();
    let charProgress = 0;

    const setIdx = (next: number) => {
      eventIdxRef.current = next;
      setEventIdx(next);
    };
    const setTypedIfChanged = (s: string) => {
      if (s !== lastTypedRef.current) {
        lastTypedRef.current = s;
        setTyped(s);
      }
    };

    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(80, now - lastTime) / 1000;
      lastTime = now;
      const s = stepRef.current;

      if (s <= 0) {
        // Hold at start of stream — reset clock so next entry to step 1 starts fresh.
        if (eventIdxRef.current !== 0) setIdx(0);
        setTypedIfChanged("");
        charProgress = 0;
        streamStartRef.current = null;
      } else {
        // Streaming. Track when this run started so the multiplier is
        // measured from there.
        if (streamStartRef.current === null) {
          streamStartRef.current = now;
        }
        const elapsed = (now - streamStartRef.current) / 1000;
        const speedMult = Math.pow(1.2, elapsed); // +20% per second

        const cur = eventIdxRef.current;
        const remaining = EVENTS.length - cur;
        if (remaining <= 1) {
          // Finished — hold on the last event.
          raf = requestAnimationFrame(tick);
          return;
        }

        if (speedMult < 25) {
          // Letter-by-letter mode (legible). Base 40 chars/sec, scaled.
          const ev = EVENTS[Math.min(cur, EVENTS.length - 1)];
          const charsPerSec = 40 * speedMult;
          charProgress += dt * charsPerSec;
          const want = Math.min(ev.text.length, Math.floor(charProgress));
          setTypedIfChanged(ev.text.slice(0, want));
          // Inter-event gap shrinks with speedMult.
          const gapChars = Math.max(2, 12 / speedMult);
          if (charProgress > ev.text.length + gapChars) {
            setIdx(Math.min(EVENTS.length - 1, cur + 1));
            charProgress = 0;
            setTypedIfChanged("");
          }
        } else {
          // Blur mode — events fly through at full speed.
          // Convert speedMult to events/sec via a coarse scaling.
          const eventsPerSec = Math.max(8, speedMult * 0.6);
          const adv = Math.max(1, Math.floor(dt * eventsPerSec));
          setIdx(Math.min(EVENTS.length - 1, cur + adv));
          setTypedIfChanged("");
          charProgress = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resources tally: notch up only when we pass a real job-submission event.
  // BUMPS is a pre-computed, time-ordered list of (eventIdx, cpu_h, gpu_h)
  // derived from real sacct data — see prep_easter_bumps.py output.
  // The lastBumpIdxRef caches how far into BUMPS we've consumed so we don't
  // re-sum the entire array every frame.
  const lastBumpRef = useRef(0);
  useEffect(() => {
    if (step < 1) {
      setResources({ cpu: 0, gpu: 0 });
      lastBumpRef.current = 0;
      return;
    }
    let cpu = 0, gpu = 0;
    let cursor = 0;
    while (cursor < BUMPS.length && BUMPS[cursor].idx <= eventIdx) {
      cpu += BUMPS[cursor].cpu_h;
      gpu += BUMPS[cursor].gpu_h;
      cursor++;
    }
    lastBumpRef.current = cursor;
    setResources({ cpu: Math.round(cpu), gpu: Math.round(gpu) });
  }, [eventIdx, step]);

  // Counter pop-flash: when a new bump fires, briefly highlight the changed value.
  const [pulseSig, setPulseSig] = useState(0);
  const lastResRef = useRef({ cpu: 0, gpu: 0 });
  useEffect(() => {
    if (resources.cpu !== lastResRef.current.cpu || resources.gpu !== lastResRef.current.gpu) {
      lastResRef.current = resources;
      setPulseSig((p) => p + 1);
    }
  }, [resources]);

  const startTerm = step >= 1;
  const showPhone = step >= 1;
  // Resources panel appears together with the phone — no separate click for
  // CPU/GPU. Daniel narrates over the streaming + phone + resources together.
  const showResources = step >= 1;
  // Surface the live speed multiplier so the terminal header can show it.
  const [speedMult, setSpeedMult] = useState(1);
  useEffect(() => {
    if (step < 1) { setSpeedMult(1); return; }
    let id = window.setInterval(() => {
      const start = streamStartRef.current;
      if (start === null) { setSpeedMult(1); return; }
      const elapsed = (performance.now() - start) / 1000;
      setSpeedMult(Math.pow(1.2, elapsed));
    }, 250);
    return () => window.clearInterval(id);
  }, [step]);
  const isRapid = speedMult >= 25;

  // Auto-scroll terminal to bottom whenever a new event is typed/added.
  useEffect(() => {
    const el = termScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [eventIdx, typed, startTerm]);

  // Slice events for terminal display (rolling window).
  const termFrom = Math.max(0, eventIdx - TERMINAL_WINDOW + 1);
  const termEvents = EVENTS.slice(termFrom, eventIdx + 1);
  // Slice events for phone (filter tool, then window).
  const phoneSliceTo = eventIdx + 1;
  const phoneEvents: Ev[] = [];
  for (let i = phoneSliceTo - 1; i >= 0 && phoneEvents.length < PHONE_WINDOW; i--) {
    if (EVENTS[i].role !== "tool") phoneEvents.unshift(EVENTS[i]);
  }

  return (
    <EasterShell
      beat={5}
      headline={isRapid ? "The project, sped 100×." : "Two minutes of typing. Then Perlmutter woke up."}
      align="top"
    >
      <div className={`grid w-full ${showPhone ? "grid-cols-[1fr_340px]" : "grid-cols-1"} gap-6 max-w-[1600px]`}>
        {/* Terminal */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="bg-zinc-950/90 border border-white/10 rounded-md p-5 font-mono text-[clamp(14px,1.15vw,18px)] leading-relaxed shadow-2xl h-[72vh] flex flex-col relative">
            <div className="text-emerald-400/80 text-[9.5px] uppercase tracking-wider mb-2 flex justify-between shrink-0">
              <span>terminal · perlmutter</span>
              <span className="text-zinc-500 tabular-nums">
                {!startTerm
                  ? "idle"
                  : speedMult < 1.5
                  ? "live"
                  : speedMult < 100
                  ? `${speedMult.toFixed(1)}×`
                  : `${Math.round(speedMult)}× ▶`}
              </span>
            </div>

            <div
              ref={termScrollRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-hidden"
            >
            {!startTerm && (
              // Phase 0: startup lines stagger in
              <div className="space-y-0.5">
                {STARTUP_LINES.map((l, i) => (
                  <motion.div
                    key={i}
                    className={l.color || "text-zinc-300"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.3, delay: l.delay } }}
                  >
                    {l.text || " "}
                  </motion.div>
                ))}
              </div>
            )}

            {startTerm && (
              <div className="space-y-0.5">
                {termEvents.map((ev, i) => (
                  <TerminalLine
                    key={termFrom + i}
                    ev={ev}
                    typed={typed}
                    currentIdx={termFrom + i}
                    eventIdx={eventIdx}
                  />
                ))}
              </div>
            )}
            </div>

            <div className="flex justify-between text-[9.5px] text-zinc-600 tabular-nums pt-2 mt-1 border-t border-white/5 shrink-0">
              <span>events {Math.min(eventIdx + 1, EVENTS.length)} / {EVENTS.length}</span>
              <span>{isRapid ? "rapid" : startTerm ? "streaming" : "—"}</span>
            </div>
          </div>

          {/* Resources */}
          {showResources && (
            <motion.div
              className="bg-zinc-900/70 border border-white/10 rounded-md p-3 font-mono text-[11px] flex items-center gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              <div className="text-emerald-400/80 text-[9.5px] uppercase tracking-wider">resources</div>
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500 text-[10px] uppercase">cpu-h</span>
                <span className="text-zinc-100 text-[18px] tabular-nums">{resources.cpu.toLocaleString()}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500 text-[10px] uppercase">gpu-h</span>
                <span className="text-zinc-100 text-[18px] tabular-nums">{resources.gpu.toLocaleString()}</span>
              </div>
              <div className="ml-auto text-zinc-500 text-[10px]">
                Apr 2 → Apr 7 · 5 days, 4 nights
              </div>
            </motion.div>
          )}
        </div>

        {/* Phone */}
        {showPhone && (
          <motion.div
            className="flex justify-center items-start"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.7 } }}
          >
            <PhoneFrame dim={isRapid}>
              <div className="h-7 flex items-center justify-between px-4 pt-1 text-[10px] font-mono text-zinc-300">
                <span>11:02</span>
                <span className="flex gap-1.5">
                  <span className="text-[9px]">•••</span>
                </span>
              </div>
              <div className="mx-2 mt-1 rounded-lg bg-zinc-900 border border-white/5 px-2 py-1.5 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div className="text-amber-300 text-[10px]">☀</div>
                <div className="font-mono text-[10px] text-zinc-200 truncate">Claude Code · easter-beamspot</div>
              </div>
              <div className="mx-2 mt-2 overflow-hidden">
                {phoneEvents.map((ev, i) => (
                  <Bubble key={`${eventIdx}-${i}`} ev={ev} />
                ))}
              </div>
            </PhoneFrame>
          </motion.div>
        )}
      </div>
    </EasterShell>
  );
}
