"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

// ─────────────────────────────────────────────────────────────────────
// Real, verified literature on agentic AI across physics-adjacent fields,
// Jan 2024 → Apr 2026. Curated by:
//   - particle physics: Daniel's ScienceDash literature view
//   - other fields: dispatched lit-review agents (each verified arxiv IDs).
//
// monthIdx 0 = Jan 2024, 27 = Apr 2026.
// ─────────────────────────────────────────────────────────────────────

type Field = "particle" | "theory" | "astro" | "climate" | "materials" | "chemistry" | "biology";

type Paper = {
  field: Field;
  month: number;
  id: string;          // arxiv id or "doi:..."
  title: string;       // short, slide-friendly
};

const PAPERS: Paper[] = [
  // ── Particle physics (Daniel's curated) ───────────────────────────
  { field: "particle",  month: 8,  id: "2409.06336", title: "Towards Agentic AI on Particle Accelerators" },
  { field: "particle",  month: 20, id: "2509.17255", title: "Multi-Stage Physics at a Particle Accelerator" },
  { field: "particle",  month: 21, id: "2510.02426", title: "ArgoLOOM" },
  { field: "particle",  month: 22, id: "2511.02824", title: "Kosmos: AI Scientist for Autonomous Discovery" },
  { field: "particle",  month: 23, id: "2512.07785", title: "Automating HEP Data Analysis with LLM Agents" },
  { field: "particle",  month: 23, id: "2512.15867", title: "HEPTAPOD" },
  { field: "particle",  month: 25, id: "2602.06496", title: "CoLLM · end-to-end deep learning toolbox" },
  { field: "particle",  month: 25, id: "2602.15039", title: "GRACE · experiment design + simulation" },
  { field: "particle",  month: 25, id: "2602.17536", title: "Toward a Fully Autonomous AI-Native Particle Accelerator" },
  { field: "particle",  month: 25, id: "2602.17582", title: "AI-native Research Ecosystem · Community Vision" },
  { field: "particle",  month: 26, id: "2603.05735", title: "LEP Open Data — agentic measurement" },
  { field: "particle",  month: 26, id: "2603.14553", title: "End-to-end Architecture for Collider Physics" },
  { field: "particle",  month: 26, id: "2603.20179", title: "AI Agents Already Autonomously Perform HEP" },
  { field: "particle",  month: 27, id: "2604.14696", title: "LLM Code Gen from HEP Publications" },
  { field: "particle",  month: 27, id: "2604.14718", title: "The Agentification of Scientific Research" },
  { field: "particle",  month: 27, id: "2604.18752", title: "Scientific Human-Agent Reproduction Pipeline" },
  { field: "particle",  month: 27, id: "2604.21804", title: "Phenomenological Detector Design with Agents" },

  // ── Theoretical physics ────────────────────────────────────────────
  { field: "theory",    month: 2,  id: "2403.03154", title: "Quantum Many-Body with LLMs" },
  { field: "theory",    month: 13, id: "2502.15815", title: "TPBench · theoretical physics benchmark" },
  { field: "theory",    month: 17, id: "2506.06214", title: "Theoretical Physics + Language Agents" },
  { field: "theory",    month: 21, id: "2510.05228", title: "CMT-Benchmark · condensed matter theory" },
  { field: "theory",    month: 23, id: "2512.19799", title: "PhysMaster · autonomous AI physicist" },
  { field: "theory",    month: 24, id: "2601.02484", title: "Schwartz × Claude · C-parameter Sudakov" },
  { field: "theory",    month: 26, id: "2603.04735", title: "Open Problem in Theoretical Physics via AI" },
  { field: "theory",    month: 26, id: "2603.22538", title: "FERMIACC · agents for particle theory" },
  { field: "theory",    month: 26, id: "2603.26990", title: "Agentic Diagrammatica · symbolic HEP" },
  { field: "theory",    month: 26, id: "2603.28935", title: "ALBERT · autonomous theory discovery" },
  { field: "theory",    month: 27, id: "2604.15411", title: "PRL-Bench · frontier physics LLM benchmark" },

  // ── Astrophysics ───────────────────────────────────────────────────
  { field: "astro",     month: 8,  id: "2409.14807", title: "mephisto v1 · multi-band galaxy LLM" },
  { field: "astro",     month: 10, id: "2412.00431", title: "cmbagent v1 · cosmological parameter analysis" },
  { field: "astro",     month: 11, id: "2412.06412", title: "StarWhisper Telescope · end-to-end automation" },
  { field: "astro",     month: 14, id: "2503.23170", title: "AstroAgents · hypothesis from mass spectrometry" },
  { field: "astro",     month: 15, id: "2504.03424", title: "The AI Cosmologist I" },
  { field: "astro",     month: 18, id: "2507.07155", title: "RAG agents · autonomous astro discovery" },
  { field: "astro",     month: 18, id: "2507.07257", title: "cmbagent · open-source planning + control" },
  { field: "astro",     month: 21, id: "2510.08354", title: "Mephisto · self-improving multi-band LLM" },
  { field: "astro",     month: 23, id: "2512.01270", title: "Egent · equivalent-width measurement" },
  { field: "astro",     month: 23, id: "2512.24754", title: "AstroReview · telescope proposal review" },
  { field: "astro",     month: 26, id: "2603.26953", title: "ASTER · agentic exoplanet research" },
  { field: "astro",     month: 27, id: "2604.09621", title: "Competing with AI Scientists · Astrophysics" },

  // ── Climate / earth science ───────────────────────────────────────
  { field: "climate",   month: 0,  id: "2401.09646", title: "ClimateGPT · interdisciplinary synthesis" },
  { field: "climate",   month: 10, id: "2411.13724", title: "LLMs for Climate Forecasting" },
  { field: "climate",   month: 14, id: "2503.05854", title: "Multi-Agent LLM Earth Science Discovery" },
  { field: "climate",   month: 15, id: "2504.04319", title: "Geo-OLM · sustainable earth observation" },
  { field: "climate",   month: 15, id: "2504.12110", title: "LLM Agents for Earth Observation" },
  { field: "climate",   month: 19, id: "2508.04719", title: "GeoFlow · agentic geospatial workflow" },
  { field: "climate",   month: 20, id: "2509.23141", title: "Earth-Agent · earth observation agents" },
  { field: "climate",   month: 21, id: "2510.18318", title: "Earth AI · geospatial foundation models" },
  { field: "climate",   month: 22, id: "2511.20109", title: "ClimateAgent · multi-agent climate workflows" },
  { field: "climate",   month: 24, id: "2601.01891", title: "Agentic AI in Remote Sensing · taxonomy" },
  { field: "climate",   month: 25, id: "2602.09723", title: "AI-Assisted Scientific Assessment · climate" },
  { field: "climate",   month: 26, id: "2603.13840", title: "ClimateAgents · social-climate dynamics" },
  { field: "climate",   month: 26, id: "2603.22148", title: "OpenEarth-Agent · tool calling → tool creation" },
  { field: "climate",   month: 27, id: "2604.01647", title: "Multi-Agent Environmental Data Workflows" },
  { field: "climate",   month: 27, id: "2604.16922", title: "ClimAgent · open-ended climate science" },

  // ── Condensed matter / materials ──────────────────────────────────
  { field: "materials", month: 5,  id: "2406.13163", title: "LLMatDesign · autonomous materials discovery" },
  { field: "materials", month: 12, id: "2501.10385", title: "AILA · autonomous microscopy LLM agents" },
  { field: "materials", month: 15, id: "2504.00741", title: "MatAgent · accelerated inorganic design" },
  { field: "materials", month: 17, id: "2506.05616", title: "MAPPS · planning + physics + scientists" },
  { field: "materials", month: 21, id: "2510.09901", title: "Autonomous Agents for Discovery (orchestration)" },
  { field: "materials", month: 23, id: "2512.19458", title: "Agentic Framework · autonomous materials computation" },
  { field: "materials", month: 24, id: "2602.00169", title: "Agentic Intelligence for Materials Science" },
  { field: "materials", month: 25, id: "2602.07491", title: "GraphAgents · cross-domain materials design" },
  { field: "materials", month: 27, id: "2604.02688", title: "MatClaw · code-first materials exploration" },
  { field: "materials", month: 27, id: "2604.11957", title: "A-Lab GPSS · self-driving lithium halide lab" },
  { field: "materials", month: 27, id: "2604.19789", title: "From Data to Theory · autonomous materials" },
  { field: "materials", month: 27, id: "2604.23758", title: "ElementsClaw · agentic atomic+language fusion" },

  // ── Chemistry ──────────────────────────────────────────────────────
  { field: "chemistry", month: 4,  id: "2406.13163", title: "LLMatDesign · materials" },
  { field: "chemistry", month: 6,  id: "2407.01603", title: "Review · LLMs + autonomous agents in chemistry" },
  { field: "chemistry", month: 10, id: "2411.15692", title: "DrugAgent · multi-agent drug discovery" },
  { field: "chemistry", month: 13, id: "2502.17506", title: "CLADD · RAG-enhanced drug discovery agents" },
  { field: "chemistry", month: 16, id: "2505.07027", title: "LLM-Augmented Synthesis Decision Programs" },
  { field: "chemistry", month: 18, id: "2507.17448", title: "Reasoning-driven retrosynthesis · LLM + RL" },
  { field: "chemistry", month: 19, id: "2508.14111", title: "From AI for Science to Agentic Science · survey" },
  { field: "chemistry", month: 20, id: "2509.20988", title: "AOT* · synthesis planning via LLM tree search" },
  { field: "chemistry", month: 20, id: "2509.25651", title: "AutoLabs · autonomous chemical experimentation" },
  { field: "chemistry", month: 21, id: "2510.16590", title: "Atom-anchored LLMs · retrosynthesis demo" },
  { field: "chemistry", month: 24, id: "2601.17687", title: "ChemCRAFT · agentic RL chemical models" },
  { field: "chemistry", month: 26, id: "2603.01311", title: "Catalyst-Agent · autonomous catalyst screening" },
  { field: "chemistry", month: 26, id: "2603.03655", title: "Mozi · governed autonomy for drug discovery" },

  // ── Biology / drug discovery ──────────────────────────────────────
  { field: "biology",   month: 3,  id: "2404.18021", title: "CRISPR-GPT · LLM agent for gene editing" },
  { field: "biology",   month: 4,  id: "2405.17631", title: "BioDiscoveryAgent · genetic perturbation design" },
  { field: "biology",   month: 10, id: "doi:10.1101/2024.11.11.623004", title: "Virtual Lab · SARS-CoV-2 nanobody design" },
  { field: "biology",   month: 12, id: "2501.04227", title: "Agent Laboratory · LLM research assistants" },
  { field: "biology",   month: 13, id: "2502.18864", title: "AI Co-Scientist · Google DeepMind" },
  { field: "biology",   month: 16, id: "2505.13400", title: "Robin · multi-agent scientific discovery" },
  { field: "biology",   month: 17, id: "doi:10.1101/2025.05.30.656746", title: "Biomni · biomedical AI agent" },
  { field: "biology",   month: 17, id: "doi:10.1101/2025.06.03.657658", title: "OriGene · self-evolving virtual biologist" },
  { field: "biology",   month: 18, id: "2507.02004", title: "STELLA · self-evolving biomed agent" },
  { field: "biology",   month: 18, id: "2507.09023", title: "Tippy · DMTA cycle drug discovery" },
  { field: "biology",   month: 20, id: "doi:10.1101/2025.09.01.673319", title: "BioML-bench · agent eval for biomed ML" },
  { field: "biology",   month: 21, id: "2510.27130", title: "AI Agents in Drug Discovery" },
  { field: "biology",   month: 25, id: "2602.10163", title: "Beyond SMILES · agentic drug discovery eval" },
  { field: "biology",   month: 26, id: "doi:10.1038/s41551-026-01634-6", title: "BioMedAgent · multi-agent biomed analysis" },
];

const FIELD_ORDER: Field[] = ["particle", "theory", "astro", "climate", "materials", "chemistry", "biology"];
const FIELD_LABEL: Record<Field, string> = {
  particle:  "particle physics",
  theory:    "theoretical physics",
  astro:     "astrophysics",
  climate:   "climate",
  materials: "condensed matter",
  chemistry: "chemistry",
  biology:   "biology",
};

const MONTHS = 28; // Jan 2024 → Apr 2026

const W = 1700;
const H = 820;

// Step 0 layout: particle physics fills the entire body, papers stacked
// vertically per month-bucket so each title can be read.
const PAD0 = { left: 80, right: 320, top: 60, bottom: 80 };
const BODY_W0 = W - PAD0.left - PAD0.right;
const BODY_H0 = H - PAD0.top - PAD0.bottom;

// Step 1+ layout: 7 lanes — each row tall enough that intra-row jitter
// can actually spread papers vertically. ROW_H ~95 px → ±32 px jitter.
const PAD = { left: 200, right: 60, top: 50, bottom: 80 };
const BODY_W = W - PAD.left - PAD.right;
const BODY_H = H - PAD.top - PAD.bottom;
const ROW_H = BODY_H / FIELD_ORDER.length;

const YEAR_TICKS = [
  { m: 0,  label: "2024" },
  { m: 12, label: "2025" },
  { m: 24, label: "2026" },
];

function xMonth0(m: number) { return PAD0.left + (m / (MONTHS - 1)) * BODY_W0; }
function xMonth(m: number)  { return PAD.left  + (m / (MONTHS - 1)) * BODY_W; }
function yField(f: Field)   { return PAD.top + FIELD_ORDER.indexOf(f) * ROW_H + ROW_H / 2; }

// ─────────────────────────────────────────────────────────────────────

export function StatsFeint({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.7 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col p-8 md:p-12 gap-3">
        <Header step={step} />

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {step <= 0 ? <ParticleOnlyTimeline /> : <FullTimeline step={step} />}

          {step >= 1 && step < 3 && <Chips />}
        </div>

        {step >= 3 && <FeaturedSchwartz />}
      </div>
    </motion.div>
  );
}

function Header({ step }: { step: number }) {
  return (
    <motion.div
      className="flex items-start justify-between"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
    >
      <div className="font-serif italic text-zinc-200 text-[clamp(22px,2.2vw,36px)]">
        {step <= 0
          ? "agentic AI × particle physics · 2024 → 2026"
          : "agentic AI × physics · 2024 → 2026"}
      </div>
      <Counter step={step} />
    </motion.div>
  );
}

function Counter({ step }: { step: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const total = step <= 0
      ? PAPERS.filter((p) => p.field === "particle").length
      : PAPERS.length;
    let cur = 0;
    const id = window.setInterval(() => {
      cur += Math.max(1, Math.floor(total / 80));
      if (cur >= total) {
        cur = total;
        window.clearInterval(id);
      }
      setN(cur);
    }, 60);
    return () => window.clearInterval(id);
  }, [step]);
  return (
    <div className="text-right font-mono tabular-nums">
      <div className="text-[clamp(28px,3vw,46px)] text-zinc-100 leading-none">{n}</div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-1">
        papers · 28 months
      </div>
    </div>
  );
}

// Step 0: For each month (x position), center the stack of papers
// vertically with a fixed stride between them. Single-paper months sit
// exactly on the midline; multi-paper months radiate symmetrically.
function ParticleOnlyTimeline() {
  const particles = PAPERS.filter((p) => p.field === "particle").sort((a, b) => a.month - b.month);

  const byMonth = new Map<number, Paper[]>();
  for (const p of particles) {
    const arr = byMonth.get(p.month) || [];
    arr.push(p);
    byMonth.set(p.month, arr);
  }

  const stride = 160; // vertical px between papers within a month
  const midY = PAD0.top + BODY_H0 / 2;

  const dots: { p: Paper; cx: number; cy: number; orderIdx: number }[] = [];
  let order = 0;
  for (const [m, list] of [...byMonth.entries()].sort((a, b) => a[0] - b[0])) {
    const cx = xMonth0(m);
    const n = list.length;
    const totalSpan = (n - 1) * stride;
    // Per-month offset so successive single-paper months don't all sit
    // at the same y (their labels would overlap). Bounded to ±36 px so
    // multi-paper stacks stay near the middle.
    const monthOffset = (((m * 5) % 7) - 3) * 12;
    const startY = midY + monthOffset - totalSpan / 2;
    list.forEach((p, j) => {
      const cy = startY + j * stride;
      dots.push({ p, cx, cy, orderIdx: order++ });
    });
  }

  return (
    <div className="w-full flex-1 min-h-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Year baseline */}
        <line x1={PAD0.left} x2={PAD0.left + BODY_W0} y1={H - PAD0.bottom + 4} y2={H - PAD0.bottom + 4} stroke="rgba(255,255,255,0.2)" />
        {YEAR_TICKS.map((t) => (
          <g key={t.m}>
            <line
              x1={xMonth0(t.m)} x2={xMonth0(t.m)}
              y1={PAD0.top - 6} y2={H - PAD0.bottom + 12}
              stroke="rgba(255,255,255,0.10)"
              strokeDasharray="3 6"
            />
            <text x={xMonth0(t.m)} y={H - PAD0.bottom + 36} textAnchor="middle"
                  fontSize={20} fontFamily="var(--font-geist-mono)"
                  fill="#a1a1aa" letterSpacing="0.18em">
              {t.label}
            </text>
          </g>
        ))}
        <text x={xMonth0(MONTHS - 1)} y={H - PAD0.bottom + 36} textAnchor="end"
              fontSize={14} fontFamily="var(--font-geist-mono)" fill="#fbbf24">
          Apr 2026
        </text>

        {/* Dots + title labels */}
        {dots.map((d) => {
          const orderDelay = (d.p.month / MONTHS) * 1.8 + d.orderIdx * 0.05;
          return (
            <motion.g
              key={d.p.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.45, delay: orderDelay } }}
            >
              <circle cx={d.cx} cy={d.cy} r={6} fill="#7dd3fc" stroke="#bae6fd" strokeWidth={0.8} />
              <line x1={d.cx + 8} y1={d.cy} x2={d.cx + 22} y2={d.cy} stroke="#7dd3fc" strokeOpacity={0.55} strokeWidth={0.8} />
              <text
                x={d.cx + 26}
                y={d.cy + 4}
                fontSize={13}
                fontFamily="var(--font-serif)"
                fill="#e4e4e7"
              >
                {d.p.title}
              </text>
              <text
                x={d.cx + 26}
                y={d.cy + 18}
                fontSize={9.5}
                fontFamily="var(--font-geist-mono)"
                fill="#71717a"
              >
                {d.p.id}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

function isFieldVisible(f: Field, step: number): boolean {
  if (f === "particle") return true;
  return step >= 2;
}

// Step 1+: 7-lane compressed layout. Particle physics highlighted, others
// fade in at step 2.
function FullTimeline({ step }: { step: number }) {
  return (
    <div className="w-full flex-1 min-h-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {FIELD_ORDER.map((f, i) => {
          const visible = isFieldVisible(f, step);
          const isParticle = f === "particle";
          return (
            <motion.g
              key={f}
              initial={{ opacity: 0 }}
              animate={{ opacity: visible ? 1 : 0, transition: { duration: 0.5, delay: isParticle ? 0 : 0.3 + i * 0.18 } }}
            >
              <rect
                x={PAD.left}
                y={PAD.top + i * ROW_H + 2}
                width={BODY_W}
                height={ROW_H - 4}
                fill={isParticle ? "rgba(125,211,252,0.07)" : "rgba(255,255,255,0.02)"}
                stroke={isParticle ? "rgba(125,211,252,0.25)" : "rgba(255,255,255,0.06)"}
                strokeWidth={0.6}
                rx={3}
              />
              <text
                x={PAD.left - 14}
                y={PAD.top + i * ROW_H + ROW_H / 2 + 6}
                textAnchor="end"
                fontSize={isParticle ? 19 : 16}
                fill={isParticle ? "#7dd3fc" : "#a1a1aa"}
                fontFamily="var(--font-serif)"
                fontStyle={isParticle ? "italic" : "normal"}
              >
                {FIELD_LABEL[f]}
              </text>
            </motion.g>
          );
        })}

        <line x1={PAD.left} x2={PAD.left + BODY_W} y1={H - PAD.bottom + 2} y2={H - PAD.bottom + 2} stroke="rgba(255,255,255,0.2)" />
        {YEAR_TICKS.map((t) => (
          <g key={t.m}>
            <line
              x1={xMonth(t.m)} x2={xMonth(t.m)}
              y1={PAD.top - 6} y2={H - PAD.bottom + 8}
              stroke="rgba(255,255,255,0.10)"
              strokeDasharray="2 5"
            />
            <text x={xMonth(t.m)} y={H - PAD.bottom + 30} textAnchor="middle"
                  fontSize={16} fontFamily="var(--font-geist-mono)"
                  fill="#a1a1aa" letterSpacing="0.18em">
              {t.label}
            </text>
          </g>
        ))}
        <text x={xMonth(MONTHS - 1)} y={H - PAD.bottom + 30} textAnchor="end"
              fontSize={12} fontFamily="var(--font-geist-mono)" fill="#fbbf24">
          Apr 2026
        </text>

        {(() => {
          // Same center-and-stride algorithm, but per (field, month) bucket
          // so each row's dots are centered on the row mid-line with a
          // fixed vertical stride.
          const ROW_STRIDE = 22;
          const buckets = new Map<string, Paper[]>();
          PAPERS.forEach((p) => {
            const key = `${p.field}:${p.month}`;
            const arr = buckets.get(key) || [];
            arr.push(p);
            buckets.set(key, arr);
          });

          const out: React.ReactElement[] = [];
          let globalIdx = 0;
          for (const [key, list] of buckets) {
            const f = list[0].field;
            const month = list[0].month;
            const visible = isFieldVisible(f, step);
            const isParticle = f === "particle";
            const cx = xMonth(month);
            const midY = yField(f);
            const span = (list.length - 1) * ROW_STRIDE;
            const startY = midY - span / 2;
            list.forEach((p, j) => {
              const cy = startY + j * ROW_STRIDE;
              const orderDelay = (p.month / MONTHS) * 1.8 + globalIdx * 0.012;
              globalIdx++;
              out.push(
                <motion.circle
                  key={key + j + p.id}
                  cx={cx}
                  cy={cy}
                  r={isParticle ? 7 : 6}
                  fill={isParticle ? "#7dd3fc" : "#fbbf24"}
                  fillOpacity={isParticle ? 0.95 : 0.9}
                  stroke={isParticle ? "#bae6fd" : "#fde68a"}
                  strokeWidth={0.8}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: visible ? 1 : 0,
                    scale: visible ? 1 : 0,
                    transition: { duration: 0.4, delay: visible ? orderDelay : 0 },
                  }}
                />
              );
            });
          }
          return out;
        })()}
      </svg>
    </div>
  );
}

function Chips() {
  return (
    <motion.div
      className="flex items-center gap-3 flex-wrap"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
    >
      <Chip label="recipe" />
      <Chip label="pattern">
        <span className="ml-2 font-serif italic text-[12px] text-zinc-500 line-through">
          PhD-scale ≈ 4 years
        </span>
        <span className="ml-2 font-mono text-[12px] text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-[1px] rounded-sm">
          agent ≈ days
        </span>
      </Chip>
      <Chip label="cross-reference" />
    </motion.div>
  );
}

function Chip({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center">
      <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-300 border border-white/15 rounded-sm px-2 py-1 bg-zinc-900/60">
        {label}
      </span>
      {children}
    </div>
  );
}

function FeaturedSchwartz() {
  return (
    <motion.div
      className="flex items-end justify-between gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
    >
      <div className="flex items-center gap-5 bg-zinc-900/85 border border-white/15 shadow-2xl rounded-sm p-4 w-[560px]">
        <img
          src={asset("/img/schwartz_claude_first-01.png")}
          alt="Schwartz × Claude paper first page"
          className="w-[120px] h-auto rounded-sm border border-white/10"
        />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-zinc-100 text-[15px] leading-snug">
            Resummation of the C-Parameter Sudakov Shoulder Using Effective Field Theory
          </div>
          <div className="mt-2 font-sans text-[12px] text-zinc-300 leading-snug">
            Matthew D. Schwartz · <span className="italic">AI Research Assistant: Claude Opus 4.5 (Anthropic)</span>
          </div>
          <div className="mt-2 font-mono text-[10.5px] text-zinc-500">
            arXiv:2601.02484 · 5 Jan 2026
          </div>
        </div>
      </div>

      <div className="font-serif italic text-zinc-200 text-[clamp(18px,1.8vw,28px)] text-right leading-snug pb-2">
        non-negligible fraction · end of 2026
      </div>
    </motion.div>
  );
}
