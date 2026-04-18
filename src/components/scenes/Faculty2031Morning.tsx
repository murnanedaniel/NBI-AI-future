"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

type Run = {
  id: string;
  label: string;
  status: "complete" | "running" | "queued";
  progress?: number;
  note: string;
};
type Alert = {
  id: string;
  level: "high" | "medium" | "low";
  title: string;
  note: string;
};
type Ping = {
  id: string;
  from: string;
  kind: "responded" | "question";
  note: string;
};

const RUNS: Run[] = [
  { id: "sim-imfA", label: "sim · IMF-A · z=10", status: "complete", note: "1024 MW-mass halos · baseline" },
  { id: "sim-imfB", label: "sim · IMF-B · z=10-13", status: "complete", note: "top-heavy variant · ALMA-25 dust priors" },
  { id: "sim-imfC", label: "sim · IMF-C · z=10", status: "complete", note: "null control" },
  { id: "emulator", label: "train · UV-LF emulator v3", status: "running", progress: 84, note: "ETA 3h · 8× H200" },
];

const ALERTS: Alert[] = [
  { id: "jades",  level: "high",   title: "JADES-NEW-z11.3-27a",      note: "spec follow-up · matches your target selection" },
  { id: "ngdeep", level: "medium", title: "NGDEEP bright outlier",     note: "check systematics · flagged last week" },
  { id: "euclid", level: "medium", title: "Euclid EDS-N proto-cluster", note: "added to z=3.44 Cosmic-Vine sample" },
];

const PINGS: Ping[] = [
  { id: "p1", from: "@collab_alma",   kind: "responded", note: "dust temp posteriors attached · 4.2 GB" },
  { id: "p2", from: "@collab_jwst",   kind: "question",  note: "asks: is your IMF z-dependent? needs your reply" },
  { id: "p3", from: "@collab_euclid", kind: "responded", note: "EDS-N catalog refresh applied" },
];

const HYPOTHESIS = `
Overnight I ran three IMF variants against the combined JWST NIRCam + Euclid EDS-N + ALMA-2025 sample at z = 10–13.

Variant B (modestly top-heavy, with dust-temperature posteriors updated from @collab_alma) reproduces the z=10 and z=11 UV luminosity functions within 1.2σ — without invoking a Pop-III enhancement.

A residual tension at z=13 (Fig. B, bright end) is consistent with a dust-correction systematic of 1.6 ± 0.3 across the two brightest bins. If real, this closes most of the "too many massive galaxies" puzzle.

I'd like to lock this in with a full posterior fit before drafting.`.trim();

const FILTERED_TOTAL = 2_143_662;
const FILTERED_KEPT = 3;

export function Faculty2031Morning() {
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
        <CoffeeBanner />

        <div className="grid grid-cols-3 gap-4 flex-shrink-0">
          <Panel title="overnight compute" count={`${RUNS.filter(r => r.status === "complete").length}/${RUNS.length} complete`} delay={0.4}>
            <ul className="space-y-2.5">
              {RUNS.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-[12px]">
                  <StatusDot status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-ink/90 truncate">{r.label}</div>
                    <div className="text-[10.5px] text-ink/55 leading-snug">{r.note}</div>
                    {r.progress !== undefined && (
                      <div className="mt-1 h-1 bg-ink/10 rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full bg-sky-700"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.progress}%`, transition: { duration: 1.2, delay: 0.8 } }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="telescope alerts · last 12h" count={`${FILTERED_KEPT} kept · ${(FILTERED_TOTAL/1000).toFixed(0)}K filtered`} delay={0.6}>
            <ul className="space-y-2.5">
              {ALERTS.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-[12px]">
                  <LevelDot level={a.level} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-ink/90 truncate">{a.title}</div>
                    <div className="text-[10.5px] text-ink/55 leading-snug">{a.note}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-2 mt-2 border-t border-ink/10 text-[10px] text-ink/45 font-mono">
              sources: JWST · Euclid · ALMA · Rubin v24
            </div>
          </Panel>

          <Panel title="collaborator pings" count={`${PINGS.filter(p => p.kind === "question").length} need reply`} delay={0.8}>
            <ul className="space-y-2.5">
              {PINGS.map((p) => (
                <li key={p.id} className="flex items-start gap-2 text-[12px]">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${p.kind === "question" ? "bg-amber-600" : "bg-emerald-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-ink/90 truncate">{p.from}</div>
                    <div className="text-[10.5px] text-ink/55 leading-snug">{p.note}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-2 mt-2 border-t border-ink/10 text-[10px] text-ink/45 font-mono">
              autonomous · their agents → your agent · overnight
            </div>
          </Panel>
        </div>

        <HypothesisCard />
      </div>
    </motion.div>
  );
}

function Header() {
  const clockRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = performance.now();
    const update = () => {
      if (!clockRef.current) return;
      const secs = Math.floor((performance.now() - start) / 1000);
      const m = 47 + Math.floor(secs / 60);
      const s = secs % 60;
      clockRef.current.textContent = `08:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };
    const id = window.setInterval(update, 1000);
    update();
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="flex items-start justify-between"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink/50 font-mono">
          Act 3 · faculty · day 2027 · <span ref={clockRef}>08:47:00</span>
        </div>
        <div className="mt-1 font-serif italic text-ink text-[clamp(22px,2.3vw,34px)] leading-tight">
          good morning, prof.
        </div>
      </div>
      <div className="font-mono text-[10.5px] text-ink/55 text-right space-y-0.5 tabular-nums">
        <div className="text-sky-800">[high-z galaxies · DAWN]</div>
        <div>agent platform · overnight summary</div>
        <div className="pt-1 mt-1 border-t border-ink/10">
          live · synced 34s ago
        </div>
      </div>
    </motion.div>
  );
}

function CoffeeBanner() {
  return (
    <motion.div
      className="font-mono text-[11px] text-ink/45 italic"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.25 } }}
    >
      ☕ coffee machine #2 out of service (day 3) · snuck to tower B · successful
    </motion.div>
  );
}

function Panel({ title, count, delay, children }: { title: string; count?: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-4 flex flex-col min-h-[220px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.55, delay } }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink/60">{title}</div>
        {count && <div className="font-mono text-[10px] text-ink/50">{count}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: Run["status"] }) {
  const color = status === "complete" ? "bg-emerald-600" : status === "running" ? "bg-sky-700 animate-pulse" : "bg-ink/25";
  return <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

function LevelDot({ level }: { level: Alert["level"] }) {
  const color = level === "high" ? "bg-amber-600" : level === "medium" ? "bg-sky-700" : "bg-ink/25";
  return <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

function HypothesisCard() {
  return (
    <motion.div
      className="bg-paper ink-shadow rounded-md p-5 flex-1 min-h-[240px] flex flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.65, delay: 1.2 } }}
    >
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-ink/10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55">
            your agent · hypothesis · draft #3
          </div>
          <div className="font-serif italic text-ink text-[clamp(18px,1.8vw,26px)] leading-tight mt-1">
            Excess of massive galaxies at z &gt; 10: the dust-correction scenario
          </div>
        </div>
        <div className="font-mono text-[10px] text-ink/50 text-right">
          ready · awaiting sign-off
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-[1fr_300px] gap-6">
        <div className="font-sans text-[13.5px] text-ink/80 leading-relaxed whitespace-pre-line">
          {HYPOTHESIS}
        </div>

        <ResidualSpark />
      </div>

      <motion.div
        className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between gap-4 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.6, delay: 2.0 } }}
      >
        <div className="font-mono text-[11px] text-ink/55 flex items-center gap-5">
          <span>next: <span className="text-ink/80">full posterior fit</span></span>
          <span>~30K CPU-h · ~220 GPU-h · 48h wall</span>
          <span>3 co-authors tagged</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <button className="px-3 py-1.5 rounded-sm border border-ink/15 bg-paper/60 text-ink/70 hover:bg-ink/5">iterate</button>
          <button className="px-3 py-1.5 rounded-sm border border-emerald-700/40 bg-emerald-600/10 text-emerald-800">approve → queue + draft</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResidualSpark() {
  const W = 300;
  const H = 130;
  const bins = [
    { z: 10.0, obs: 1.08, sim: 1.05 },
    { z: 10.5, obs: 1.12, sim: 1.07 },
    { z: 11.0, obs: 1.18, sim: 1.10 },
    { z: 11.5, obs: 1.35, sim: 1.22 },
    { z: 12.0, obs: 1.48, sim: 1.33 },
    { z: 12.5, obs: 1.72, sim: 1.42 },
    { z: 13.0, obs: 1.96, sim: 1.50 },
  ];
  const xs = (i: number) => 30 + (i / (bins.length - 1)) * (W - 50);
  const ys = (v: number) => H - 20 - ((v - 1) / 1.1) * (H - 40);
  const simPath = bins.map((b, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(b.sim)}`).join(" ");

  return (
    <div className="bg-ink/[0.015] border border-ink/10 rounded-sm p-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55 mb-1">Fig B · UV-LF bright bin · obs vs sim</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1="30" x2={W - 20} y1={ys(1)} y2={ys(1)} stroke="#141414" strokeOpacity="0.2" />
        <line x1="30" x2="30" y1="10" y2={H - 20} stroke="#141414" strokeOpacity="0.2" />
        <motion.path
          d={simPath}
          fill="none"
          stroke="#0369a1"
          strokeWidth="1.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, transition: { duration: 1.4, delay: 1.6 } }}
        />
        {bins.map((b, i) => (
          <motion.circle
            key={i}
            cx={xs(i)}
            cy={ys(b.obs)}
            r="3"
            fill="#b45309"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.9 + i * 0.08 } }}
          />
        ))}
        <text x="30" y={H - 5} fontSize="9" fill="#525252" fontFamily="var(--font-geist-mono)">z=10</text>
        <text x={W - 40} y={H - 5} fontSize="9" fill="#525252" fontFamily="var(--font-geist-mono)">z=13</text>
        <g fontFamily="var(--font-geist-mono)" fontSize="9" fill="#525252">
          <rect x={W - 80} y="14" width="8" height="2" fill="#0369a1" />
          <text x={W - 68} y="18" fill="#0369a1">sim (IMF-B)</text>
          <circle cx={W - 76} cy="30" r="2.5" fill="#b45309" />
          <text x={W - 68} y="33" fill="#b45309">obs</text>
        </g>
      </svg>
      <div className="font-mono text-[9.5px] text-ink/55 mt-1 leading-snug">
        residual at z≥12 ≈ 1.6 × dust-correction factor
      </div>
    </div>
  );
}
