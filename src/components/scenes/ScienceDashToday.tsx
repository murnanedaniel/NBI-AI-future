"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// ScienceDash · Para 10 walkthrough.
// All visible UI (except the workhorse-terminal beat) is a real screenshot
// of the live dashboard at localhost:3000 — captured for the
// `cmockitum0000inhl902oph6w` project ("ML track finding for HL-LHC").
//
//   step 0 — empty laptop + cursor
//   step 1 — home page (Today / Stalled / Narrative-ready / Recent runs / …)
//   step 2 — project overview (status, hypothesis, §16.1 fields, GitHub, W&B)
//   step 3 — brain · Plan tab (HUMAN_DIRECTIVE, PROJECT_BRIEF, MEMORY_LOG)
//   step 4 — workhorses · live terminals (autonomous Claude Code sessions)
//   step 5 — feed (decisions / suggestions / status from local-claude,
//             workhorses, review-agent — real messages)
// ─────────────────────────────────────────────────────────────────────

// Real commands the workhorse terminals cycle through. Lifted from the
// Easter logs + ScienceDash MCP tool calls — these are the kinds of
// commands a workhorse really runs.
const WORKHORSE_TERMS: { host: string; cmds: string[] }[] = [
  {
    host: "perlmutter:sd-cmockitu",
    cmds: [
      "$ sciencedash mcp post_message --kind status \\",
      "    --body 'directive revive_session executed'",
      "→ ok: true",
      "$ python ablate.py --hypothesis bins-vs-tokens",
      "loaded ColliderML/ttbar/pu0 · 240k events",
      "[step 4500] tracking_eff=0.984  fake=2.1e-4",
      "$ wandb sync runs/bins_vs_tokens_v3/",
    ],
  },
  {
    host: "perlmutter:sd-cmockitu-models",
    cmds: [
      "$ git pull && pytest tests/ -k 'maskformer'",
      "tests/test_maskformer.py::test_loss PASSED",
      "$ python train.py --config configs/maskformer.yaml",
      "spawning 4 GPU workers ...",
      "$ tail -f logs/maskformer/train.log",
      "[epoch 12] val_eff=0.967  budget: 41/100 GPU-h",
      "$ sciencedash mcp log_run --hyp h2 --gpu_h 41 \\",
      "    --metric tracking_efficiency=0.967",
    ],
  },
  {
    host: "perlmutter:lit-watch",
    cmds: [
      "$ python lit_watch.py --field tracking",
      "found 3 new arxiv preprints",
      "$ python summarise.py papers/2604.*.pdf",
      "summaries → memory/lit_2026-04.md",
      "$ sciencedash mcp post_message --kind suggestion \\",
      "    --body 'narrow scope · evidence: 0 runs / 41 notes'",
      "→ ok: true",
    ],
  },
];

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: "min(1700px, 96%)" }}>
      <div className="relative rounded-t-2xl border border-zinc-300 bg-zinc-900 p-2 shadow-2xl">
        <div className="rounded-xl bg-paper overflow-hidden aspect-[16/10] relative">
          <div className="absolute top-0 left-0 right-0 h-9 bg-zinc-100 border-b border-zinc-200 flex items-center px-3 gap-2 z-10">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 max-w-md mx-auto rounded bg-white border border-zinc-200 px-2 py-1 font-mono text-[12px] text-zinc-500 truncate text-center">
              dash.science
            </div>
            <div className="font-mono text-[10px] text-zinc-400">live</div>
          </div>
          <div className="absolute inset-0 pt-9">{children}</div>
        </div>
      </div>
      <div className="mx-auto h-3 w-[103%] -translate-x-[1.5%] rounded-b-2xl bg-zinc-300 border-x border-b border-zinc-400" />
      <div className="mx-auto h-2 w-[40%] rounded-b-md bg-zinc-200 border-x border-b border-zinc-300" />
    </div>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-5 bg-ink/70 align-middle"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1.0, repeat: Infinity }}
    />
  );
}

// Scrolling screenshot — image rendered at width 100% of the laptop screen
// so its full natural height extends below the visible window. The image
// then translates up over `duration` seconds to reveal the rest of the
// page, mimicking a real scroll-through. scrollPct is the fraction of the
// image's own height to scroll (computed per image from full-page captures
// vs. the laptop's 16:10 viewport).
function ScreenshotView({
  src,
  alt,
  scrollPct = 0,
  duration = 8,
  delay = 1.0,
}: {
  src: string;
  alt: string;
  scrollPct?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        className="absolute top-0 left-0 w-full"
        initial={{ opacity: 0, y: "0%" }}
        animate={{
          opacity: 1,
          y: `${-scrollPct}%`,
          transition: {
            opacity: { duration: 0.7 },
            y: { duration, delay, ease: "linear" },
          },
        }}
      />
    </div>
  );
}

function MiniTerm({ host, cmds }: { host: string; cmds: string[] }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCharIdx((c) => c + 1);
    }, 30);
    const advance = window.setInterval(() => {
      setLineIdx((li) => {
        const cur = cmds[li];
        if (charIdx >= cur.length + 14) {
          setCharIdx(0);
          return (li + 1) % cmds.length;
        }
        return li;
      });
    }, 60);
    return () => { window.clearInterval(id); window.clearInterval(advance); };
  }, [lineIdx, charIdx, cmds]);

  const visible: string[] = [];
  for (let i = 0; i <= lineIdx; i++) {
    if (i < lineIdx) visible.push(cmds[i]);
    else visible.push(cmds[i].slice(0, charIdx));
  }
  const last5 = visible.slice(-5);

  return (
    <div className="bg-zinc-950 rounded-md font-mono text-[11px] text-zinc-200 leading-relaxed shadow-2xl flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-white/15 flex items-center justify-between flex-shrink-0">
        <span className="text-emerald-400/85 text-[9.5px] uppercase tracking-wider">{host}</span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
        </div>
      </div>
      <div className="px-3 py-2 flex-1 overflow-hidden">
        {last5.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {l}
            {i === last5.length - 1 && (
              <span className="inline-block w-[5px] h-[1em] bg-zinc-300 ml-px align-baseline animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkhorsesTerminalView() {
  return (
    <div className="absolute inset-0 bg-paper p-6 overflow-hidden flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-serif italic text-ink text-[clamp(20px,1.7vw,28px)]">workhorses</div>
          <div className="font-mono text-[11px] text-ink/55 mt-1">
            Claude Code sessions on Perlmutter · autonomous · live
          </div>
        </div>
        <div className="font-mono text-[11px] text-emerald-700/85">
          3 active · governed by the project brain
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {WORKHORSE_TERMS.map((t) => (
          <MiniTerm key={t.host} host={t.host} cmds={t.cmds} />
        ))}
      </div>

      <div className="font-mono italic text-[11px] text-ink/55">
        a workhorse is just a Claude Code session on a compute cluster — running unsupervised.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Top-level scene
// ─────────────────────────────────────────────────────────────────────

export function ScienceDashToday({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-full max-w-[1700px]">
          <LaptopFrame>
            <AnimatePresence mode="wait">
              {step <= 0 && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="font-mono text-[14px] text-ink/60">
                    sciencedash <BlinkingCursor />
                  </div>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <ScreenshotView
                    src="/img/sciencedash/home.png"
                    alt="ScienceDash home — Today / Stalled / Narrative-ready / Recent runs"
                    scrollPct={60}
                    duration={11}
                  />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <ScreenshotView
                    src="/img/sciencedash/overview.png"
                    alt="Project overview — status, hypothesis, §16.1 fields, GitHub, W&B"
                    scrollPct={67}
                    duration={13}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <ScreenshotView
                    src="/img/sciencedash/plan.png"
                    alt="Brain · Plan tab — HUMAN_DIRECTIVE, PROJECT_BRIEF, MEMORY_LOG"
                    scrollPct={8}
                    duration={5}
                  />
                </motion.div>
              )}
              {step === 4 && (
                <motion.div key="workhorses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <WorkhorsesTerminalView />
                </motion.div>
              )}
              {step >= 5 && (
                <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <ScreenshotView
                    src="/img/sciencedash/feed.png"
                    alt="Feed — decisions, suggestions, status from local-claude, workhorses, review-agent"
                    scrollPct={39}
                    duration={8}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </LaptopFrame>

          <motion.div
            className="mt-3 font-mono italic text-[12px] text-center text-ink/65"
            initial={{ opacity: 0 }}
            animate={step >= 1 ? { opacity: 1, transition: { duration: 0.6, delay: 0.4 } } : { opacity: 0 }}
          >
            {step === 1 && "real · running · today · dash.science"}
            {step === 2 && "every project: docs · hypotheses · budget · GitHub · W&B"}
            {step === 3 && "the brain — a Claude Code thread with a heartbeat. memory + plan, every cycle."}
            {step === 4 && "what a workhorse is: an autonomous shell on a compute cluster."}
            {step >= 5 && "the feed — decisions, suggestions, status. once-per-day human nudge."}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
