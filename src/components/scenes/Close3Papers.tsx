"use client";

import { motion } from "motion/react";

type Paper = {
  title: string;
  date: string;
  blurb: string;
  tag: string;
};

// NOTE: these are placeholder predictions. Daniel regenerates by feeding
// Claude his recent work (Easter beamspot paper, GNN4ITk papers, ColliderML)
// the week before the talk. Output format: same shape as below.
const PAPERS: Paper[] = [
  {
    title: "Beam-Spot Invariance II: Production Deployment of Cross-Track Attention in ATLAS Tracking",
    date: "est. Oct 2026",
    blurb:
      "Builds on the Easter analysis. Benchmarks the randomized-training + cross-track architecture inside Athena; quantifies the stability of the implicit vertex prior under real luminosity drift.",
    tag: "direct follow-up",
  },
  {
    title: "Learned Calibration Priors Across HL-LHC Systems: A Framework",
    date: "est. Apr 2027",
    blurb:
      "Generalises the beam-spot-as-calibration finding beyond tracking: calorimeter response, pileup subtraction, alignment. Proposes a common architectural pattern for implicitly-calibrated networks.",
    tag: "generalisation",
  },
  {
    title: "AI-Directed Analysis Design in the GNN4ITk Era",
    date: "est. Oct 2027",
    blurb:
      "The meta paper. Codifies the dispatch → investigate → decide loop used on the Easter study. Benchmarks agent-driven analysis design against human-only baselines on three HEP tasks.",
    tag: "methodological / meta",
  },
];

export function Close3Papers({ step }: { step: number }) {
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
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink/50 font-mono">Close · predictions</div>
          <div className="mt-2 font-serif italic text-ink text-[clamp(26px,3.2vw,44px)] leading-tight">
            my next three papers.
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink/50">
            I never wrote them. Claude thinks they&rsquo;re what&rsquo;s next.
          </div>
        </motion.div>

        <div className="flex-1 flex items-center justify-center">
          <div className="grid md:grid-cols-3 gap-5 max-w-[1200px] w-full">
            {PAPERS.map((p, i) => (
              <PaperCard key={i} paper={p} visible={step >= i} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          className="pt-4 border-t border-ink/10 flex items-center justify-between font-mono text-[11px] text-ink/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.8 } }}
        >
          <span>placeholder · regenerate pre-talk from your recent work</span>
          <span>I&rsquo;ll let you know in six months if it was right.</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PaperCard({ paper, visible, index }: { paper: Paper; visible: boolean; index: number }) {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-5 flex flex-col gap-3 min-h-[300px]"
      initial={{ opacity: 0, y: 12, rotate: index === 0 ? -1 : index === 2 ? 1 : 0 }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 12,
        transition: { duration: 0.6 },
      }}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55">paper {index + 1}</div>
        <div className="font-mono text-[10px] text-ink/50 tabular-nums">{paper.date}</div>
      </div>

      <div className="font-serif italic text-ink text-[clamp(15px,1.3vw,19px)] leading-tight">
        {paper.title}
      </div>

      <div className="text-[12.5px] text-ink/75 leading-snug flex-1">
        {paper.blurb}
      </div>

      <div className="pt-2 border-t border-ink/10 font-mono text-[10px] text-ink/50 uppercase tracking-wider">
        {paper.tag}
      </div>
    </motion.div>
  );
}
