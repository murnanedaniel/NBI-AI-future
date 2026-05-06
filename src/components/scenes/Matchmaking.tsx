"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { WINNING_PAIR } from "@/lib/winningPair";

type Person = {
  name: string;
  group: string;
  bullets: string[];
};

const A: Person = {
  name: WINNING_PAIR.a.name,
  group: WINNING_PAIR.a.group,
  bullets: [...WINNING_PAIR.a.bullets],
};

const B: Person = {
  name: WINNING_PAIR.b.name,
  group: WINNING_PAIR.b.group,
  bullets: [...WINNING_PAIR.b.bullets],
};

const ABSTRACT = WINNING_PAIR.abstract;
const ABSTRACT_WORDS = ABSTRACT.split(/\s+/);
const METHODS = [...WINNING_PAIR.methods];

// Daniel's prose intro for the pair (step 0). Italic, sits in the middle
// column where the abstract will later stream.
const PROSE = "But they have both been looking at the same problem: how to read the iron-redox state of those tephra shards — Eliza, because the redox state controls how much sulphate the eruption pushed into the stratosphere; Per, because his spin-Hamiltonian toolkit can invert bulk magnetic susceptibility back to Fe³⁺/Fe²⁺ ratios without destroying the shard.";

export function Matchmaking({ step }: { step: number }) {
  const [typedA, setTypedA] = useState("");
  const [typedB, setTypedB] = useState("");
  const [streamedWords, setStreamedWords] = useState(0);

  // Auto-type names on mount. Does not depend on step.
  useEffect(() => {
    const targetA = A.name;
    const targetB = B.name;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      if (i <= targetA.length) setTypedA(targetA.slice(0, i));
      else if (i <= targetA.length + 3) {
        // small pause then start B
      } else if (i <= targetA.length + 3 + targetB.length) {
        setTypedB(targetB.slice(0, i - targetA.length - 3));
      } else {
        clearInterval(id);
      }
    }, 55);
    return () => clearInterval(id);
  }, []);

  // Stream abstract once we hit step 1.
  useEffect(() => {
    if (step < 1) {
      setStreamedWords(0);
      return;
    }
    const id = window.setInterval(() => {
      setStreamedWords((w) => {
        if (w >= ABSTRACT_WORDS.length) {
          clearInterval(id);
          return w;
        }
        return w + 1;
      });
    }, 110); // faster than original 180ms — pacing fix from storyboard
    return () => clearInterval(id);
  }, [step]);

  const abstractDone = streamedWords >= ABSTRACT_WORDS.length;

  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.0, delay: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <CanvasCrosshairs />

      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-700/70 font-mono">
              live generation · opt-in only
            </div>
            <div className="mt-2 font-serif italic text-ink text-[clamp(28px,3.3vw,46px)] leading-tight">
              {step === 0 ? "Two researchers, one problem." : "The winning ticket — drafted in 60 seconds."}
            </div>
          </div>
          <div className="font-mono text-[11px] text-ink/50 text-right tabular-nums">
            <div>live generation · opt-in only</div>
            <div>pushed to <span className="text-sky-700">NBI-AI-future/matchmaking/…</span></div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-[300px_1fr_300px] gap-8 items-stretch mt-6">
          <PersonCard person={A} typed={typedA} />

          <div className="relative">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="prose"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                >
                  <div className="font-serif italic text-ink text-[clamp(18px,1.7vw,26px)] leading-[1.55] text-center px-6 max-w-[760px]">
                    {PROSE}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="grant"
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                >
                  <GrantCard
                    streamedWords={streamedWords}
                    abstractDone={abstractDone}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <PersonCard person={B} typed={typedB} mirror />
        </div>

        <motion.div
          className="pt-4 font-mono text-[11px] text-ink/40 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.8 } }}
        >
          <span>press <kbd className="px-1.5 py-0.5 bg-ink/10 rounded text-ink/60">F</kbd> for pre-recorded fallback</span>
          <span>demo · placeholder names until opt-ins collected</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PersonCard({ person, typed, mirror }: { person: Person; typed: string; mirror?: boolean }) {
  return (
    <motion.div
      className={`bg-paper/60 ink-shadow rounded-md p-4 ${mirror ? "text-right" : ""}`}
      initial={{ opacity: 0, x: mirror ? 14 : -14 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.2 } }}
    >
      <div className={`flex items-center gap-3 ${mirror ? "flex-row-reverse" : ""}`}>
        <div className="h-12 w-12 rounded-full bg-sky-700/10 border border-sky-700/30 flex items-center justify-center text-sky-700 font-serif italic text-[18px]">
          {person.name.split(" ")[0][0]}
        </div>
        <div className={mirror ? "text-right" : ""}>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{person.group}</div>
          <div className="font-serif text-ink text-[clamp(18px,1.6vw,24px)] leading-tight">
            {typed}
            <span className="inline-block w-[6px] h-[16px] bg-ink/40 ml-0.5 align-middle animate-pulse" style={{ visibility: typed.length === person.name.length ? "hidden" : "visible" }} />
          </div>
        </div>
      </div>
      <ul className={`mt-3 space-y-1.5 text-[clamp(13px,1.1vw,16px)] text-ink/70 font-sans leading-snug ${mirror ? "text-right" : ""}`}>
        {person.bullets.map((b, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2"
            style={{ flexDirection: mirror ? "row-reverse" : "row" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.6 + i * 0.12 } }}
          >
            <span className="text-sky-700/60 text-[11px] leading-tight mt-0.5">·</span>
            <span>{b}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function GrantCard({ streamedWords, abstractDone }: { streamedWords: number; abstractDone: boolean }) {
  const streamed = ABSTRACT_WORDS.slice(0, streamedWords).join(" ");

  return (
    <motion.div className="relative bg-paper ink-shadow rounded-md p-6 h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50">
          Proposed joint investigation · 2026–2029
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-ink/50">
          <span className={`h-2 w-2 rounded-full ${abstractDone ? "bg-emerald-600" : "bg-emerald-500 animate-pulse"}`} />
          {abstractDone ? "complete" : "streaming"}
        </div>
      </div>

      <div className="mt-3 font-serif text-ink text-[clamp(20px,1.95vw,30px)] leading-tight">
        {WINNING_PAIR.title}
      </div>

      <div className="mt-3 font-sans text-[clamp(14.5px,1.25vw,18px)] text-ink/85 leading-relaxed min-h-[140px]">
        {streamed}
        {!abstractDone && <span className="inline-block w-[6px] h-[15px] bg-ink/50 ml-0.5 align-middle animate-pulse" />}
      </div>

      {abstractDone && (
        <motion.div
          className="mt-5 pt-4 border-t border-ink/10 grid grid-cols-[1fr_auto] gap-6 items-start"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        >
          <ul className="space-y-1.5 text-[clamp(13.5px,1.15vw,17px)] text-ink/80">
            {METHODS.map((m, i) => (
              <motion.li
                key={i}
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: i * 0.15 } }}
              >
                <span className="text-sky-700/70">·</span>
                <span>{m}</span>
              </motion.li>
            ))}
          </ul>
          <div className="font-mono text-[11px] text-ink/60 text-right">
            <div>{WINNING_PAIR.budget.dkk}</div>
            <div>{WINNING_PAIR.budget.years} years</div>
            <div>{WINNING_PAIR.budget.people}</div>
          </div>
        </motion.div>
      )}

      {abstractDone && (
        <motion.div
          className="mt-4 font-mono text-[10px] text-ink/40 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.8 } }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          pushed to <span className="text-sky-700 underline">NBI-AI-future/matchmaking/2026-05-xx/pair-01</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function CanvasCrosshairs() {
  const corners = [
    { x: 20, y: 20 },
    { x: -20, y: 20, flipX: true },
    { x: 20, y: -20, flipY: true },
    { x: -20, y: -20, flipX: true, flipY: true },
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {corners.map((c, i) => (
        <g key={i} opacity="0.2">
          <line x1={c.flipX ? `calc(100% - ${c.x}px)` : c.x} y1={c.flipY ? `calc(100% - ${c.y}px)` : c.y}
            x2={c.flipX ? `calc(100% - ${c.x + 26}px)` : c.x + 26} y2={c.flipY ? `calc(100% - ${c.y}px)` : c.y}
            stroke="#141414" strokeWidth="0.8" />
          <line x1={c.flipX ? `calc(100% - ${c.x}px)` : c.x} y1={c.flipY ? `calc(100% - ${c.y}px)` : c.y}
            x2={c.flipX ? `calc(100% - ${c.x}px)` : c.x} y2={c.flipY ? `calc(100% - ${c.y + 26}px)` : c.y + 26}
            stroke="#141414" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}
