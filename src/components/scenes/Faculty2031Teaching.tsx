"use client";

import { motion } from "motion/react";

type Bubble = {
  who: "ai" | "student";
  text: string;
};

const CHAT: Bubble[] = [
  { who: "ai",      text: "What's the role of the cutoff Λ in this calculation?" },
  { who: "student", text: "It's the energy scale where we stop trusting the EFT, right?" },
  { who: "ai",      text: "Right. So why does the result not depend on Λ?" },
  { who: "student", text: "...because everything above Λ has been integrated out." },
];

type Idea = {
  title: string;
  sub: string;
};

const IDEAS: Idea[] = [
  { title: "Student-to-student teaching", sub: "peer-led problem solving · the lecturer is a referee" },
  { title: "Discussions in the group",    sub: "your job: ask the awkward question" },
  { title: "Project work",                 sub: "no one finishes alone any more" },
];

type EvidenceCard = {
  uni: string;
  summary: string;
  cite: string;
};

const EVIDENCE: EvidenceCard[] = [
  {
    uni: "Harvard",
    summary: "active-learning physics class beats traditional lecture",
    cite: "PS2 physics · Kestin & Miller · Fall 2023, n=194",
  },
  {
    uni: "Stanford",
    summary: "AI-tutored math students outperform a control cohort",
    cite: "math AI tutor · RCT · 2025",
  },
  {
    uni: "Carnegie Mellon",
    summary: "AI scaffolds + human instructor lift gains across the board",
    cite: "human-AI hybrid tutoring · 2025",
  },
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-[58vh] rounded-[40px] border-[10px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
      style={{ aspectRatio: "9 / 19" }}
    >
      <div className="absolute inset-0 rounded-[32px] bg-zinc-950 overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-black z-20" />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ time = "20:14" }: { time?: string }) {
  return (
    <div className="relative h-7 flex items-center justify-between px-6 pt-1 text-[10px] font-mono text-zinc-300 z-10">
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

function TutorHeader() {
  return (
    <div className="mx-3 mt-1 flex items-center gap-2.5 px-2 py-2 border-b border-white/8">
      <div className="h-7 w-7 rounded-full bg-emerald-700/30 border border-emerald-300/40 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(167,243,208,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 L20 6 V14 L12 18 L4 14 V6 Z" />
          <path d="M12 10 V18" />
          <path d="M4 6 L12 10 L20 6" />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-[11px] text-zinc-100">Physics tutor</span>
        <span className="font-mono text-[9.5px] text-zinc-400">QFT I</span>
      </div>
      <span className="ml-auto font-mono text-[9.5px] text-zinc-500">online</span>
    </div>
  );
}

function ChatBubble({ b, i }: { b: Bubble; i: number }) {
  const isStudent = b.who === "student";
  return (
    <motion.div
      className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.4 + i * 0.5 } }}
    >
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-[11.5px] leading-snug ${
          isStudent
            ? "bg-sky-500/85 text-white rounded-br-md"
            : "bg-zinc-800 text-zinc-100 rounded-bl-md border border-white/5"
        }`}
      >
        {b.text}
      </div>
    </motion.div>
  );
}

function PhoneColumn() {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
    >
      <PhoneFrame>
        <StatusBar time="20:14" />
        <TutorHeader />
        <div className="mx-3 mt-3 flex flex-col gap-2">
          {CHAT.map((b, i) => (
            <ChatBubble key={i} b={b} i={i} />
          ))}
        </div>

        <motion.div
          className="mx-3 mt-3 flex justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.4 + CHAT.length * 0.5 } }}
        >
          <div className="px-3 py-2 rounded-2xl bg-zinc-800 border border-white/5 flex items-center gap-1">
            {[0, 1, 2].map((n) => (
              <motion.span
                key={n}
                className="block w-1.5 h-1.5 rounded-full bg-zinc-400"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: n * 0.15 }}
              />
            ))}
          </div>
        </motion.div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-900 border border-white/8">
          <span className="font-mono text-[10.5px] text-zinc-500 truncate">type your answer…</span>
          <span className="ml-auto h-6 w-6 rounded-full bg-emerald-600/30 border border-emerald-300/40 flex items-center justify-center text-[10px] text-emerald-200">↑</span>
        </div>
      </PhoneFrame>

      <motion.div
        className="font-serif italic text-ink/55 text-[12px] mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.7, delay: 1.2 } }}
      >
        Tuesday evening · 1 of 38 students
      </motion.div>
    </motion.div>
  );
}

function IdeaCard({ idea, delay }: { idea: Idea; delay: number }) {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-5 border border-ink/15"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay } }}
    >
      <div className="font-serif italic text-ink text-[clamp(18px,1.7vw,26px)] leading-tight">
        {idea.title}
      </div>
      <div className="font-mono text-[11px] text-ink/55 mt-2 leading-snug">
        {idea.sub}
      </div>
    </motion.div>
  );
}

function EvidenceRow({ evidence }: { evidence: typeof EVIDENCE }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4 max-w-[1100px] w-full mx-auto"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
    >
      {evidence.map((c, i) => (
        <motion.div
          key={c.uni}
          className="rounded-md border border-ink/15 bg-paper ink-shadow p-4 flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, delay: i * 0.2 } }}
        >
          <div className="font-serif text-ink text-[clamp(20px,1.9vw,28px)] leading-tight">
            {c.uni}
          </div>
          <div className="font-serif text-ink/75 text-[clamp(13px,1.1vw,16px)] leading-snug">
            {c.summary}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55 leading-snug">
            {c.cite}
          </div>
        </motion.div>
      ))}
      <motion.div
        className="col-span-3 mt-3 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.7 } }}
      >
        <div className="font-serif italic text-ink text-[clamp(36px,5vw,64px)] leading-none text-center">
          ~2× learning rate
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/55 mt-2">
          Kestin &amp; Miller · Sci. Rep. 2025 · RCT, N=194
        </div>
      </motion.div>
    </motion.div>
  );
}

// 4 steps:
//   step 0 — "What does teaching look like in 2028?" centred fullscreen.
//   step 1 — question to top, phone (Before class) appears.
//   step 2 — During-class idea cards appear on the right.
//   step 3 — Evidence row (Harvard / Stanford / CMU + 2× headline) replaces
//            the body to back the case with data.
export function Faculty2031Teaching({ step = 0 }: { step?: number }) {
  const expanded = step >= 1;
  const showPhone = step >= 1;
  const showIdeas = step >= 2;
  const showEvidence = step >= 3;

  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* Step 0: question centred fullscreen.
          Step 1+: question shrinks + migrates to top. */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 font-serif italic text-ink text-center leading-tight"
        animate={{
          top: expanded ? "5vh" : "44vh",
          fontSize: expanded ? "clamp(22px,2.3vw,34px)" : "clamp(36px,5vw,76px)",
          transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
        }}
        initial={false}
      >
        What does teaching look like in 2028?
      </motion.div>

      {/* Body */}
      {expanded && !showEvidence && (
        <motion.div
          className="absolute inset-x-0 bottom-0 px-8 md:px-12 pb-10"
          style={{ top: "16vh" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5 } }}
        >
          <div className="grid grid-cols-[auto_1fr] gap-10 md:gap-16 h-full items-center max-w-[1500px] mx-auto">
            {/* LEFT — phone with "Before class" caption */}
            <div className="flex flex-col items-center gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/65">
                Before class
              </div>
              {showPhone && <PhoneColumn />}
            </div>

            {/* RIGHT — During class idea cards (step 2+) */}
            <div className="flex flex-col gap-4 max-w-[720px]">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/65 mb-1">
                During class
              </div>
              {showIdeas ? (
                <>
                  <IdeaCard idea={IDEAS[0]} delay={0.1} />
                  <IdeaCard idea={IDEAS[1]} delay={0.3} />
                  <IdeaCard idea={IDEAS[2]} delay={0.5} />
                </>
              ) : (
                <div className="h-[440px]" />
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: evidence (replaces body — keeps the question pinned at top). */}
      {showEvidence && (
        <motion.div
          className="absolute inset-x-0 px-8 md:px-12"
          style={{ top: "20vh" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6 } }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/65 mb-6 text-center">
            already happening · Harvard · Stanford · Carnegie Mellon
          </div>
          <EvidenceRow evidence={EVIDENCE} />
        </motion.div>
      )}
    </motion.div>
  );
}
