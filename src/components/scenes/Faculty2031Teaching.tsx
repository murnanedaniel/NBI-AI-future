"use client";

import { motion } from "motion/react";

type Escalation = {
  id: string;
  count: number;
  question: string;
  origin: string;
  severity: "high" | "medium" | "low";
};

const ESCALATIONS: Escalation[] = [
  {
    id: "q1",
    count: 4,
    question: "Why does the UV cutoff Λ disappear from the final answer?",
    origin: "emerged from AI dialogue · 4 students converged",
    severity: "medium",
  },
  {
    id: "q2",
    count: 3,
    question: "Is a ‘virtual particle’ a real thing or a bookkeeping device?",
    origin: "AI gave conflicting framings on rerun · 3 students flagged",
    severity: "medium",
  },
  {
    id: "q3",
    count: 2,
    question: "If dim-reg preserves gauge invariance automatically, why learn the others?",
    origin: "2 students, both deeper than the prompt invited",
    severity: "low",
  },
  {
    id: "q4",
    count: 1,
    question: "The AI said anomaly cancellation in the SM is “coincidental.” Is that right?",
    origin: "1 student · AI was wrong · prof lecture today",
    severity: "high",
  },
];

const CLASS_PLAN = [
  { time: "10:15", who: "student A", topic: "presents their Q1 dialogue" },
  { time: "10:25", who: "class",     topic: "open discussion · Q2" },
  { time: "10:40", who: "student B", topic: "presents their Q3 puzzle" },
  { time: "10:50", who: "you",       topic: "Q4 · the hard one · lecture + correction" },
];

const GROUNDING = [
  { label: "Harvard · PS2 Pal",        cite: "Kestin et al. · Sci. Rep. 2025 · >2× learning gain / unit time (RCT, N=194)" },
  { label: "arXiv:2510.14457",         cite: "“Closing the Loop” · instructor-in-the-loop escalation · 22% hints unhelpful" },
  { label: "Harvard · CS50.ai",        cite: "Malan et al. · SIGCSE ’25 · feedback → next cohort tutor" },
  { label: "Georgia Tech · Jill Watson", cite: "Kakar et al. · 78.7% correctness · OMSCS deployment, 600+ students" },
];

const DISSENT = [
  { label: "Riley · Cognitive Resonance, 2024", point: "if AI handles the struggle, does learning move?" },
  { label: "Bender · PsychSci, 2024",           point: "a stochastic generator is not an interlocutor." },
];

export function Faculty2031Teaching() {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col p-8 md:p-10 gap-3">
        <Header />

        <div className="grid grid-cols-[420px_1fr] gap-4 flex-1 min-h-0">
          <LeftColumn />
          <EscalationCard />
        </div>

        <GroundingStrip />
      </div>
    </motion.div>
  );
}

function Header() {
  return (
    <motion.div
      className="flex items-start justify-between"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink/50 font-mono">
          Act 3 · faculty · day 2027 · 10:12
        </div>
        <div className="mt-1 font-serif italic text-ink text-[clamp(22px,2.3vw,34px)] leading-tight">
          next: class. the hard part is already done.
        </div>
      </div>
      <div className="font-mono text-[10.5px] text-ink/55 text-right space-y-0.5 tabular-nums">
        <div className="text-sky-800">[QFT I · 42 students · Aud. A]</div>
        <div>class · 10:15 → 11:00</div>
        <div className="pt-1 mt-1 border-t border-ink/10">pre-class tutor window closed · 09:30</div>
      </div>
    </motion.div>
  );
}

function LeftColumn() {
  return (
    <div className="grid grid-rows-[auto_auto_1fr] gap-4 min-h-0">
      <PreClassCard />
      <ClassPlanCard />
      <DissentCard />
    </div>
  );
}

function PreClassCard() {
  const stats = [
    ["students",           "42",          "enrolled"],
    ["completed pre-class","38 / 42",      "avg 1h 47m"],
    ["AI dialogue turns",  "1,248",       "median 28 / student"],
    ["“unhelpful” hints",  "22%",          "students flagged"],
    ["escalated to you",   "11 items → 4", "distilled overnight"],
  ];

  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/60">before class · 06:00 → 09:30</div>
        <div className="font-mono text-[10px] text-ink/50">AI tutor · PS2-Pal lineage</div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {stats.map(([k, v, note]) => (
          <div key={k} className="flex flex-col">
            <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50">{k}</div>
            <div className="font-serif text-ink text-[20px] leading-none mt-1 tabular-nums">{v}</div>
            <div className="font-mono text-[9.5px] text-ink/55 mt-1 leading-tight">{note}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ClassPlanCard() {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.7 } }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/60">class plan · 45 min</div>
        <div className="font-mono text-[10px] text-ink/50">students lead · you close</div>
      </div>
      <ul className="space-y-1.5 font-mono text-[11.5px] text-ink/80">
        {CLASS_PLAN.map((p, i) => (
          <motion.li
            key={p.time}
            className="grid grid-cols-[52px_76px_1fr] gap-3 items-baseline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.9 + i * 0.08 } }}
          >
            <span className="text-ink/55 tabular-nums">{p.time}</span>
            <span className="text-sky-800">{p.who}</span>
            <span className="text-ink/75">{p.topic}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function DissentCard() {
  return (
    <motion.div
      className="bg-transparent border border-dashed border-ink/25 rounded-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8, delay: 1.5 } }}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55 mb-2">known critique · read before teaching</div>
      <ul className="space-y-2 text-[11.5px] text-ink/70 leading-snug">
        {DISSENT.map((d) => (
          <li key={d.label} className="flex flex-col">
            <span className="font-serif italic text-ink/85">“{d.point}”</span>
            <span className="font-mono text-[10px] text-ink/50 mt-0.5">{d.label}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function EscalationCard() {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-5 flex flex-col min-h-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.5 } }}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink/10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55">escalation packet · distilled from 1,248 AI turns</div>
          <div className="font-serif italic text-ink text-[clamp(18px,1.8vw,26px)] leading-tight mt-1">
            four sticking points. your move.
          </div>
        </div>
        <div className="font-mono text-[10px] text-ink/50 text-right">
          <div>auto-ranked</div>
          <div>by student load × AI confidence drop</div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-hidden">
        {ESCALATIONS.map((e, i) => (
          <motion.div
            key={e.id}
            className={`rounded-sm border-l-[3px] pl-3 py-1 ${
              e.severity === "high"
                ? "border-amber-600 bg-amber-500/5"
                : e.severity === "medium"
                ? "border-sky-700 bg-sky-500/5"
                : "border-ink/20"
            }`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.9 + i * 0.18 } }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-serif italic text-ink text-[clamp(15px,1.3vw,20px)] leading-tight">
                {e.question}
              </div>
              <div className="font-mono text-[10px] text-ink/55 whitespace-nowrap tabular-nums">
                ×{e.count}
              </div>
            </div>
            <div className="font-mono text-[10.5px] text-ink/55 mt-0.5">{e.origin}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between gap-4 flex-wrap font-mono text-[11px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 2.0 } }}
      >
        <span className="text-ink/60">
          after class: <span className="text-ink/80">your corrections → next year&rsquo;s tutor</span>
          <span className="text-ink/45 ml-2">(see CS50 feedback loop, 2025)</span>
        </span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-sm border border-ink/15 bg-paper/60 text-ink/70">reorder</button>
          <button className="px-3 py-1.5 rounded-sm border border-emerald-700/40 bg-emerald-600/10 text-emerald-800">accept packet → start class</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GroundingStrip() {
  return (
    <motion.div
      className="pt-2 border-t border-ink/10 flex items-start gap-6 flex-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8, delay: 2.4 } }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45 flex-shrink-0">
        this exists already →
      </span>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 flex-1">
        {GROUNDING.map((g) => (
          <div key={g.label} className="text-[10.5px] leading-snug">
            <div className="font-mono text-ink/80">{g.label}</div>
            <div className="font-mono text-ink/45">{g.cite}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
