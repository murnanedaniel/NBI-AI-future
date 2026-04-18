"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Person = {
  name: string;
  group: string;
  bullets: string[];
};

const A: Person = {
  name: "Prof. [Quantum Many-Body]",
  group: "Condensed Matter Theory",
  bullets: [
    "Neural-network quantum states for strongly correlated systems",
    "Variational wavefunctions on frustrated lattices",
    "Symmetry-constrained machine-learning ansätze",
  ],
};

const B: Person = {
  name: "Prof. [Theoretical Cosmology]",
  group: "Cosmology & Astrophysics",
  bullets: [
    "Bayesian inference of inflation models from CMB polarization",
    "Large-scale structure as a probe of dark energy",
    "Non-Gaussianity in primordial perturbations",
  ],
};

const ABSTRACT =
  "We propose a three-year collaboration adapting the symmetry-constrained neural wave functions developed for frustrated magnets to the task of Bayesian inference of inflation models from high-resolution CMB polarization data. Both domains share a common mathematical substrate: high-dimensional probabilistic models with non-trivial constraint structure. We will (i) formalize the mapping between variational ansätze and cosmological posterior estimators, (ii) benchmark on the kagome Heisenberg antiferromagnet and on the Planck+BICEP polarization analysis, and (iii) release an open-source inference toolkit bridging the condensed-matter and cosmology communities.";
const ABSTRACT_WORDS = ABSTRACT.split(/\s+/);

const METHODS = [
  "Translate frustrated-magnet variational code to CMB posterior space",
  "Joint benchmark: kagome Heisenberg × Planck/BICEP polarization",
  "Open-source bridging library, Python + JAX",
];

type Phase = "idle" | "typing" | "nodes" | "streaming" | "done";

export function Matchmaking() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedA, setTypedA] = useState("");
  const [typedB, setTypedB] = useState("");
  const [streamedWords, setStreamedWords] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("typing"), 1200));

    const targetA = A.name;
    const targetB = B.name;
    let i = 0;
    const typeTimer = window.setInterval(() => {
      i++;
      if (i <= targetA.length) setTypedA(targetA.slice(0, i));
      else if (i <= targetA.length + targetB.length + 3) setTypedB(targetB.slice(0, i - targetA.length - 3));
      else {
        clearInterval(typeTimer);
        setPhase("nodes");
        timers.push(window.setTimeout(() => setPhase("streaming"), 1200));
      }
    }, 55);
    timers.push(typeTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== "streaming") return;
    const id = window.setInterval(() => {
      setStreamedWords((w) => {
        if (w >= ABSTRACT_WORDS.length) {
          clearInterval(id);
          setPhase("done");
          return w;
        }
        return w + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [phase]);

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
              Act 3 · Live · collaboration drafted in 60 seconds
            </div>
            <div className="mt-2 font-serif italic text-ink text-[clamp(28px,3.3vw,46px)] leading-tight">
              Name two NBI faculty from different groups.
            </div>
          </div>
          <div className="font-mono text-[11px] text-ink/50 text-right tabular-nums">
            <div>live generation · opt-in only</div>
            <div>pushed to <span className="text-sky-700">NBI-AI-future/matchmaking/…</span></div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-[280px_1fr_280px] gap-8 items-center mt-6">
          <PersonCard person={A} typed={typedA} show={phase !== "idle"} />

          <GrantCard
            phase={phase}
            streamedWords={streamedWords}
          />

          <PersonCard person={B} typed={typedB} show={phase !== "idle"} mirror />
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

function PersonCard({ person, typed, show, mirror }: { person: Person; typed: string; show: boolean; mirror?: boolean }) {
  return (
    <motion.div
      className={`bg-paper/60 ink-shadow rounded-md p-4 ${mirror ? "text-right" : ""}`}
      initial={{ opacity: 0, x: mirror ? 14 : -14 }}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : mirror ? 14 : -14, transition: { duration: 0.6, delay: 0.2 } }}
    >
      <div className={`flex items-center gap-3 ${mirror ? "flex-row-reverse" : ""}`}>
        <div className="h-10 w-10 rounded-full bg-sky-700/10 border border-sky-700/30 flex items-center justify-center text-sky-700 font-serif italic">
          {person.name.split(" ")[0][0]}
        </div>
        <div className={mirror ? "text-right" : ""}>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50">{person.group}</div>
          <div className="font-serif text-ink text-[16px] leading-tight">
            {typed}
            <span className="inline-block w-[6px] h-[14px] bg-ink/40 ml-0.5 align-middle animate-pulse" style={{ visibility: typed.length === person.name.length ? "hidden" : "visible" }} />
          </div>
        </div>
      </div>
      <ul className={`mt-3 space-y-1.5 text-[12px] text-ink/70 font-sans leading-snug ${mirror ? "text-right" : ""}`}>
        {person.bullets.map((b, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2"
            style={{ flexDirection: mirror ? "row-reverse" : "row" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: show ? 1 : 0, transition: { delay: 0.6 + i * 0.12 } }}
          >
            <span className="text-sky-700/60 text-[11px] leading-tight mt-0.5">·</span>
            <span>{b}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function GrantCard({ phase, streamedWords }: { phase: Phase; streamedWords: number }) {
  const streamed = ABSTRACT_WORDS.slice(0, streamedWords).join(" ");
  const showMethods = phase === "done";

  return (
    <motion.div
      className="relative bg-paper ink-shadow rounded-md p-6 min-h-[360px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: phase === "streaming" || phase === "done" || phase === "nodes" ? 1 : 0.3,
        scale: 1,
        transition: { duration: 0.6 },
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50">
          Proposed joint investigation · 2026–2029
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-ink/50">
          <span className={`h-2 w-2 rounded-full ${phase === "streaming" ? "bg-emerald-500 animate-pulse" : phase === "done" ? "bg-emerald-600" : "bg-ink/20"}`} />
          {phase === "streaming" ? "streaming" : phase === "done" ? "complete" : "waiting…"}
        </div>
      </div>

      <motion.div
        className="mt-3 font-serif text-ink text-[clamp(18px,1.7vw,26px)] leading-tight"
        animate={{ opacity: phase === "streaming" || phase === "done" ? 1 : 0.3 }}
      >
        Neural Inference Bridges: Unifying Condensed-Matter Variational Wave Functions and Cosmological Bayesian Pipelines
      </motion.div>

      <div className="mt-3 font-sans text-[13.5px] text-ink/80 leading-relaxed min-h-[140px]">
        {streamed}
        {phase === "streaming" && <span className="inline-block w-[6px] h-[13px] bg-ink/50 ml-0.5 align-middle animate-pulse" />}
      </div>

      {showMethods && (
        <motion.div
          className="mt-5 pt-4 border-t border-ink/10 grid grid-cols-[1fr_auto] gap-6 items-start"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        >
          <ul className="space-y-1.5 text-[12.5px] text-ink/70">
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
            <div>~1.4M DKK</div>
            <div>3 years</div>
            <div>1 PhD + 1 postdoc</div>
          </div>
        </motion.div>
      )}

      {showMethods && (
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
