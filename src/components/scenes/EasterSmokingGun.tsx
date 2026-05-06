"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { EasterShell } from "./EasterShell";

// Step 0: vertices flicker into existence inside a tight 25 µm circle.
// Step 1: vertices appear anywhere within a 300 µm circle (drift).
// Step 2: smoking-gun plot — d₀ residual gaussians.

const VTX_W = 760;
const VTX_H = 460;
const CTR_X = VTX_W / 2;
const CTR_Y = VTX_H / 2;
// One pixel = 1 µm on this canvas (so 300 µm fits with margin in 460 px).

type Vertex = {
  id: number;
  x: number;
  y: number;
  born: number;
  // Pre-computed track set. Each track is 4-6 helical arcs emerging from
  // (x, y) going outward at random angles with slight curvature.
  tracks: { angle: number; curvature: number; length: number }[];
};

function makeVertex(id: number, maxR: number): Vertex {
  const r = Math.sqrt(Math.random()) * maxR;
  const theta = Math.random() * 2 * Math.PI;
  const nTracks = 4 + Math.floor(Math.random() * 3);
  const tracks: Vertex["tracks"] = [];
  for (let i = 0; i < nTracks; i++) {
    tracks.push({
      angle: Math.random() * 2 * Math.PI,
      // Curvature in inverse-pixels (1/R). Real ~3 GeV LHC tracks have
      // R ≈ several metres → in canvas pixels (1px = 1µm): R ≈ 3e6 px,
      // curvature 3e-7. We use a much larger value (~3e-4) just to give
      // a slight visible bend without looping. NOW LINEAR in arc length
      // (see trackPath) so total sweep = curvature * length stays small.
      curvature: (Math.random() - 0.5) * 6e-4,
      length: 320 + Math.random() * 160,
    });
  }
  return {
    id,
    x: CTR_X + r * Math.cos(theta),
    y: CTR_Y + r * Math.sin(theta),
    born: performance.now() + Math.random() * 600,
    tracks,
  };
}

function trackPath(vx: number, vy: number, t: { angle: number; curvature: number; length: number }) {
  // Draw the (helical projection) arc as a polyline. The previous
  // implementation used a quadratic phase (curvature * s²) which compounds
  // on long tracks and made the visible arcs *loop*. For a true helix in
  // the xy plane of a barrel detector the angular sweep is LINEAR in arc
  // length (sweep = s / R), so use that instead. Total sweep for a
  // ~3 GeV track over 480 px is around 10° — visible but not loopy.
  const N = 24;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * t.length;
    const ang = t.angle + t.curvature * s;
    const x = vx + s * Math.cos(ang);
    const y = vy + s * Math.sin(ang);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function BeamVertexCanvas({ maxR, label }: { maxR: number; label: string }) {
  const [verts, setVerts] = useState<Vertex[]>([]);
  const [tick, setTick] = useState(0);

  // Spawn fresh vertices on a regular cadence; expire after ~3 s.
  useEffect(() => {
    let id = 0;
    setVerts([]);
    const spawn = window.setInterval(() => {
      id++;
      const v = makeVertex(id, maxR);
      setVerts((cur) => [...cur, v].slice(-8));
    }, 350);
    const fr = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => { window.clearInterval(spawn); window.clearInterval(fr); };
  }, [maxR]);

  // Compute alpha for each vertex based on age.
  const now = performance.now();
  void tick;

  // Scale circle: ~10 px = 1 µm visually compressed; the displayed ring
  // matches the spawn radius directly. With maxR=2.5 the ring is small
  // (matching reality — 25 µm beamspot is *tight* on a tracker scale)
  // and with maxR=30 it spreads but doesn't cover the whole canvas.
  const visualR = maxR;

  return (
    <svg viewBox={`0 0 ${VTX_W} ${VTX_H}`} className="w-full h-auto">
      {/* Outer canvas frame (faint) */}
      <rect x="0" y="0" width={VTX_W} height={VTX_H} fill="rgba(0,0,0,0.20)" />

      {/* Beam pipe axis lines */}
      <line x1="0" y1={CTR_Y} x2={VTX_W} y2={CTR_Y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
      <line x1={CTR_X} y1="0" x2={CTR_X} y2={VTX_H} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />

      {/* Scale circle */}
      <motion.circle
        cx={CTR_X}
        cy={CTR_Y}
        r={visualR}
        fill="none"
        stroke="rgba(251,191,36,0.55)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.6 } }}
      />
      <text
        x={CTR_X + visualR + 8}
        y={CTR_Y + 4}
        fontSize="14"
        fill="rgba(251,191,36,0.85)"
        fontFamily="var(--font-geist-mono)"
      >
        {label}
      </text>

      {/* Vertices + tracks */}
      {verts.map((v) => {
        const age = (now - v.born) / 1000; // seconds
        if (age < 0) return null;
        const fade = Math.max(0, 1 - age / 3);
        const draw = Math.min(1, age / 0.4);
        return (
          <g key={v.id} opacity={fade}>
            {v.tracks.map((t, i) => (
              <path
                key={i}
                d={trackPath(v.x, v.y, t)}
                fill="none"
                stroke="rgba(125,211,252,0.85)"
                strokeWidth={1.4}
                strokeLinecap="round"
                style={{
                  strokeDasharray: t.length * 1.2,
                  strokeDashoffset: t.length * 1.2 * (1 - draw),
                }}
              />
            ))}
            <circle cx={v.x} cy={v.y} r={2.5} fill="#fbbf24" />
          </g>
        );
      })}
    </svg>
  );
}

// === smoking-gun plot ===

const W = 1080;
const H = 480;
const PAD = { left: 64, right: 24, top: 28, bottom: 50 };
const X_MIN = -0.14;
const X_MAX = 0.14;
const Y_MAX = 35;

function xScale(x: number) {
  return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - PAD.left - PAD.right);
}
function yScale(y: number) {
  return H - PAD.bottom - (y / Y_MAX) * (H - PAD.top - PAD.bottom);
}

function gaussianPath(sigma: number, amplitude: number) {
  const points: string[] = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const y = amplitude * Math.exp(-(x * x) / (2 * sigma * sigma));
    points.push(`${i === 0 ? "M" : "L"}${xScale(x).toFixed(2)},${yScale(y).toFixed(2)}`);
  }
  return points.join(" ");
}

function gaussianFillPath(sigma: number, amplitude: number) {
  // Closed path so we can fill underneath the curve.
  const points: string[] = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const y = amplitude * Math.exp(-(x * x) / (2 * sigma * sigma));
    points.push(`${i === 0 ? "M" : "L"}${xScale(x).toFixed(2)},${yScale(y).toFixed(2)}`);
  }
  points.push(`L${xScale(X_MAX).toFixed(2)},${yScale(0).toFixed(2)}`);
  points.push(`L${xScale(X_MIN).toFixed(2)},${yScale(0).toFixed(2)} Z`);
  return points.join(" ");
}

function SmokingGunPlot() {
  const ckf = gaussianPath(0.02625, 15);
  const ml = gaussianPath(0.01205, 33);
  const bs = gaussianPath(0.01227, 33);
  const bsFill = gaussianFillPath(0.01227, 33);

  return (
    <div className="w-full max-w-[1280px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={xScale(0)} x2={xScale(0)} y1={yScale(0)} y2={yScale(Y_MAX)} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
        <line x1={PAD.left} x2={W - PAD.right} y1={yScale(0)} y2={yScale(0)} stroke="rgba(255,255,255,0.25)" />
        <line x1={PAD.left} x2={PAD.left} y1={yScale(0)} y2={yScale(Y_MAX)} stroke="rgba(255,255,255,0.25)" />

        {[-0.1, -0.05, 0, 0.05, 0.1].map((x) => (
          <g key={x}>
            <line x1={xScale(x)} x2={xScale(x)} y1={yScale(0)} y2={yScale(0) + 5} stroke="rgba(255,255,255,0.3)" />
            <text x={xScale(x)} y={yScale(0) + 22} textAnchor="middle" fontSize="13" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">{x.toFixed(2)}</text>
          </g>
        ))}
        <text x={(W - PAD.left - PAD.right) / 2 + PAD.left} y={H - 12} textAnchor="middle" fontSize="14" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">d₀ residual [mm]</text>

        {[0, 10, 20, 30].map((y) => (
          <g key={y}>
            <line x1={PAD.left - 5} x2={PAD.left} y1={yScale(y)} y2={yScale(y)} stroke="rgba(255,255,255,0.3)" />
            <text x={PAD.left - 10} y={yScale(y) + 5} textAnchor="end" fontSize="13" fill="#a1a1aa" fontFamily="var(--font-geist-mono)">{y}</text>
          </g>
        ))}

        {/* "predict zero" — drawn FIRST and with fill so it stands out as
            the punchline. Higher contrast colour + thicker stroke. */}
        <motion.path d={bsFill} fill="rgba(251,191,36,0.18)" stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 3.0 } }}
        />
        <motion.path d={bs} fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 3.0 } }}
        />

        <motion.path d={ckf} fill="none" stroke="#f87171" strokeWidth="2.4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 0.2 } }}
        />
        <motion.path d={ml} fill="none" stroke="#7dd3fc" strokeWidth="2.6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.2, delay: 1.6 } }}
        />

        <g fontFamily="var(--font-geist-mono)" fontSize="14">
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.0 } }}>
            <rect x={W - 270} y={36} width="14" height="3" fill="#f87171" />
            <text x={W - 252} y={42} fill="#f87171">classical method · σ = 0.0318</text>
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 2.4 } }}>
            <rect x={W - 270} y={62} width="14" height="3" fill="#7dd3fc" />
            <text x={W - 252} y={68} fill="#7dd3fc">ML · σ = 0.0147</text>
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 3.8 } }}>
            <rect x={W - 270} y={88} width="14" height="3" fill="#fbbf24" />
            <text x={W - 252} y={94} fill="#fbbf24">predict zero · σ = 0.0159</text>
          </motion.g>
        </g>
      </svg>

      <motion.div
        className="mt-6 font-serif italic text-zinc-300 text-[clamp(18px,1.6vw,28px)] leading-snug text-center max-w-[1100px] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8, delay: 4.2 } }}
      >
        ML achieves <span className="text-sky-300">0.0147 mm</span>. Predicting literally{" "}
        <span className="text-amber-300">zero</span> gets you{" "}
        <span className="text-amber-300">0.0159 mm</span>. <span className="text-zinc-400">Eight percent apart.</span>
        <div className="mt-3 not-italic font-sans text-zinc-300 text-[clamp(14px,1.2vw,18px)] leading-relaxed">
          The 2× win was never track fitting — the model learned where the beam spot sits and predicted that.
        </div>
      </motion.div>
    </div>
  );
}

// Headlines per step.
const HEADLINES = [
  "centred at the origin",
  "or drifting · hundreds of microns",
  "the smoking gun.",
];

const HINTS = [
  <>training data · σ ≈ 25 µm beamspot</>,
  <>reality · ~300 µm drift month-to-month</>,
  <>Fig 1a · d₀ residual · nominal</>,
];

export function EasterSmokingGun({ step }: { step: number }) {
  return (
    <EasterShell
      beat={3}
      headline={HEADLINES[Math.min(step, HEADLINES.length - 1)]}
      hint={HINTS[Math.min(step, HINTS.length - 1)]}
      align="top"
    >
      {step <= 0 && <BeamVertexCanvas maxR={2.5} label="25 µm" />}
      {step === 1 && <BeamVertexCanvas maxR={30} label="300 µm" />}
      {step >= 2 && <SmokingGunPlot />}
    </EasterShell>
  );
}
