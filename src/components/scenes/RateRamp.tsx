"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Step 0: single big collision, slow protons
// Step 1: 2 Hz flicker at focal
// Step 2: 5 Hz
// Step 3: 10 Hz
// Step 4: 1 000 Hz (blur)
// Step 5: grid fills → 40 MHz, 4 000 events, 10 kHz visual flicker

type StepMeta = { label: string; sub: string; hz: number | null; grid: boolean };
const STEPS: StepMeta[] = [
  { label: "one collision",          sub: "every 25 nanoseconds",        hz: null, grid: false },
  { label: "2 / second",             sub: "you can track each one",      hz: 2,    grid: false },
  { label: "5 / second",             sub: "borderline",                  hz: 5,    grid: false },
  { label: "10 / second",            sub: "losing it",                   hz: 10,   grid: false },
  { label: "1,000 / second",         sub: "just a blur",                 hz: 1000, grid: false },
  // Grid: the *counter* shows live-measured events/sec (what this laptop
  // can actually render); the sub-label reminds the audience that the real
  // LHC does 40 million of these every second.
  { label: "events / second  (measured)", sub: "LHC does 40 million of these · every second", hz: null, grid: true },
];

const BEAM_Y = 0;
const FOCAL_SCALE = 4.8;         // 3× the old default of 1.6
const TRACKS = 32;
const SEGS = 6;
const PROTON_DURATION = 90;      // frames — slow approach
// Wait for the paper-roll overlay (1.8 s) to finish rolling in before the
// first protons leave the edges. Stage mounts RateRamp after the title's
// ~0.35 s exit fade, so 1.5 s of RAF here ≈ roll-done.
const PROTON_START_DELAY = 90;   // frames (~1.5 s at 60 fps)

// ── geometry builders ─────────────────────────────────────────────────────────

function buildBurst(scale: number, tracks = TRACKS, segs = SEGS) {
  const vpp = tracks * segs * 2;
  const positions = new Float32Array(vpp * 3);
  const colors    = new Float32Array(vpp * 3);
  let p = 0, c = 0;
  for (let t = 0; t < tracks; t++) {
    const phi   = Math.random() * Math.PI * 2;
    const eta   = (Math.random() - 0.5) * 2.5;
    const theta = 2 * Math.atan(Math.exp(-eta));
    const dx = Math.sin(theta) * Math.cos(phi);
    const dy = Math.cos(theta);
    const dz = Math.sin(theta) * Math.sin(phi);
    const len = scale * (0.9 + Math.random() * 0.6);
    let px = 0, py = 0, pz = 0;
    const bright = 0.45 + Math.random() * 0.55;
    const r = bright * 0.55, g = bright * 0.92, b = bright;
    for (let s = 1; s <= segs; s++) {
      const tt = (s / segs) * len;
      const nx = dx * tt, ny = dy * tt, nz = dz * tt;
      positions[p++] = px; positions[p++] = py; positions[p++] = pz;
      positions[p++] = nx; positions[p++] = ny; positions[p++] = nz;
      colors[c++] = r; colors[c++] = g; colors[c++] = b;
      colors[c++] = r; colors[c++] = g; colors[c++] = b;
      px = nx; py = ny; pz = nz;
    }
  }
  return { positions, colors, vpp };
}

type Evt = {
  lines: THREE.LineSegments;
  geom: THREE.BufferGeometry;
  mat: THREE.LineBasicMaterial;
  age: number;
  life: number;
};

function makeEvent(x: number, y: number, z: number, scale: number, life: number): Evt {
  const { positions, colors } = buildBurst(scale);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lines = new THREE.LineSegments(geom, mat);
  lines.position.set(x, y, z);
  return { lines, geom, mat, age: 0, life };
}

// ── 40 MHz mega-grid ──────────────────────────────────────────────────────────
// Target ~15 000 cells — at 60 Hz RAF × 0.95 fire-rate ≈ 855 kHz effective,
// ~50× below the real 40 MHz bunch-crossing rate. The grid reads as "many
// simultaneous detectors" rather than pure TV static at this density.
const TARGET_CELLS = 15_000;
// Each cell is ~3–5 px on screen, so a single short line per cell is all the
// eye can resolve — rendering more per cell is just wasted draw work.
const MICRO_TRACKS = 1;
const MICRO_SEGS   = 1;
const VPP_CELL = MICRO_TRACKS * MICRO_SEGS * 2; // vertices per cell (= 2)

// Pre-computed 2-D direction table — lets regenerateCell avoid Math.sin/cos
// in the inner loop (we do 70 k × 60 Hz = 4.2 M lookups/second).
const DIR_TABLE_N = 256;
const DIR_TABLE = new Float32Array(DIR_TABLE_N * 2);
for (let i = 0; i < DIR_TABLE_N; i++) {
  const a = (i / DIR_TABLE_N) * Math.PI * 2;
  DIR_TABLE[i * 2]     = Math.cos(a);
  DIR_TABLE[i * 2 + 1] = Math.sin(a);
}

function gridDims(aspect: number) {
  const rows = Math.round(Math.sqrt(TARGET_CELLS / aspect));
  const cols = Math.round(aspect * rows);
  return { cols, rows, total: cols * rows };
}

function buildMegaGrid(
  viewW: number,
  viewH: number,
  cols: number,
  rows: number,
) {
  const total = cols * rows;
  const totalV = total * VPP_CELL;
  const pos  = new Float32Array(totalV * 3);
  const baseCols = new Float32Array(totalV * 3);
  const cellCenters = new Float32Array(total * 2);

  const cellW = viewW / cols;
  const cellH = viewH / rows;
  const scale = Math.min(cellW, cellH) * 0.75;  // slightly longer than 1 cell so tracks read

  let cellIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = -viewW / 2 + cellW * (col + 0.5);
      const cy = -viewH / 2 + cellH * (row + 0.5);
      cellCenters[cellIdx * 2]     = cx;
      cellCenters[cellIdx * 2 + 1] = cy;
      // Seed with a short neutral line so the grid isn't blank before the
      // first regeneration frame runs.
      const base = cellIdx * VPP_CELL * 3;
      pos[base]     = cx;
      pos[base + 1] = cy;
      pos[base + 2] = 0;
      pos[base + 3] = cx + scale * 0.3;
      pos[base + 4] = cy;
      pos[base + 5] = 0;
      for (let v = 0; v < VPP_CELL * 3; v += 3) {
        baseCols[base + v]     = 0.55;
        baseCols[base + v + 1] = 0.92;
        baseCols[base + v + 2] = 1.0;
      }
      cellIdx++;
    }
  }
  return { pos, cols: baseCols, scale, cellCenters };
}

// Fast 2-D regeneration of a single cell — 1 line per cell using the
// direction LUT. No trig in the hot path.
function regenerateCell(
  cell: number,
  cx: number,
  cy: number,
  scale: number,
  livePos: Float32Array,
  liveCols: Float32Array,
) {
  const base = cell * VPP_CELL * 3;
  const di = (Math.random() * DIR_TABLE_N) | 0;
  const dx = DIR_TABLE[di * 2];
  const dy = DIR_TABLE[di * 2 + 1];
  const len = scale * (0.6 + Math.random() * 0.8);
  const b = 0.4 + Math.random() * 0.6;
  const r = b * 0.55, g = b * 0.92, bl = b;

  livePos[base]     = cx;
  livePos[base + 1] = cy;
  livePos[base + 2] = 0;
  livePos[base + 3] = cx + dx * len;
  livePos[base + 4] = cy + dy * len;
  livePos[base + 5] = 0;

  liveCols[base]     = r;
  liveCols[base + 1] = g;
  liveCols[base + 2] = bl;
  liveCols[base + 3] = r;
  liveCols[base + 4] = g;
  liveCols[base + 5] = bl;
}

// ── component ─────────────────────────────────────────────────────────────────

export function RateRamp({ step }: { step: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stepRef  = useRef(step);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const subRef   = useRef<HTMLSpanElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const meta = STEPS[Math.min(STEPS.length - 1, Math.max(0, step))];
    if (labelRef.current)   labelRef.current.textContent   = meta.label;
    if (subRef.current)     subRef.current.textContent     = meta.sub;
  }, [step]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene    = new THREE.Scene();
    const aspect   = w / h;
    const viewH    = 18;
    const viewW    = viewH * aspect;
    const camera   = new THREE.OrthographicCamera(
      -viewW / 2, viewW / 2, viewH / 2, -viewH / 2, 0.1, 200,
    );
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x050607, 1);
    mount.appendChild(renderer.domElement);

    // beamline
    const beamGeom = new THREE.BufferGeometry();
    beamGeom.setAttribute("position", new THREE.BufferAttribute(
      new Float32Array([-viewW / 2, BEAM_Y, 0, viewW / 2, BEAM_Y, 0]), 3,
    ));
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.LineSegments(beamGeom, beamMat));

    // focal group (steps 0–4)
    const focalGroup = new THREE.Group();
    scene.add(focalGroup);

    const focal: Evt[] = [];

    // proton pair
    type Proton = { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; fromLeft: boolean; age: number };
    const protons: Proton[] = [];
    const spawnProtons = () => {
      for (const fromLeft of [true, false]) {
        // Spawn invisible — the PROTON_START_DELAY loop below fades them in as
        // the roll-in finishes, then starts their travel.
        const mat  = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0 });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), mat);
        mesh.position.set(fromLeft ? -viewW / 2 : viewW / 2, BEAM_Y, 0);
        focalGroup.add(mesh);
        protons.push({ mesh, mat, fromLeft, age: 0 });
      }
    };
    spawnProtons();

    const addFocalBurst = () => {
      const s = stepRef.current;
      const life = s === 0 ? 9999 : Math.max(8, Math.round(60 / (STEPS[s].hz ?? 1) * 0.8));
      const e = makeEvent(0, BEAM_Y, 0, FOCAL_SCALE, life);
      focalGroup.add(e.lines);
      focal.push(e);
    };

    // ── 40 MHz mega-grid for step 5 ──────────────────────────────────────────
    // Grid sized from viewport aspect so cells are square (equidistant).
    // Each cell regenerates in-place every frame = ~4 MHz effective, still
    // 10× short of the real 40 MHz bunch-crossing rate (60 Hz monitor cap).
    const { cols: gridCols, rows: gridRows, total: totalCells } = gridDims(aspect);
    const { pos: megaPos, scale: megaScale, cellCenters } =
      buildMegaGrid(viewW, viewH, gridCols, gridRows);
    const livePos = new Float32Array(megaPos);
    const displayCols = new Float32Array(totalCells * VPP_CELL * 3); // starts black
    const megaGeom = new THREE.BufferGeometry();
    megaGeom.setAttribute("position", new THREE.BufferAttribute(livePos, 3));
    megaGeom.setAttribute("color",    new THREE.BufferAttribute(displayCols, 3));
    const megaMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const megaLines = new THREE.LineSegments(megaGeom, megaMat);
    megaLines.visible = false;
    scene.add(megaLines);

    // state
    let alive      = true;
    let raf        = 0;
    let frame      = 0;
    let prevStep   = -1;
    let firstBurst = false;
    let protDone   = false;

    // Hz-based timing
    let lastBurstMs = 0;
    let burstDurFrames = 0;

    // grid fill progress — fill the whole grid in ~1.5 s
    let activeCount  = 0;
    const FILL_RATE  = Math.max(64, Math.ceil(totalCells / 90));

    // Measured-events counter for step 5. Counts every regenerateCell call
    // over a rolling 500 ms window and extrapolates to events/sec.
    let eventsThisWindow = 0;
    let windowStartMs = 0;

    const animate = () => {
      if (!alive) return;
      frame++;
      const now = performance.now();
      const s = Math.min(STEPS.length - 1, Math.max(0, stepRef.current));
      const meta = STEPS[s];

      // ── step change housekeeping ─────────────────────────────────────────
      if (s !== prevStep) {
        prevStep = s;
        lastBurstMs = now;

        // purge any lingering focal events (especially the step-0 life:9999 burst)
        for (let i = focal.length - 1; i >= 0; i--) {
          focalGroup.remove(focal[i].lines);
          focal[i].geom.dispose();
          focal[i].mat.dispose();
        }
        focal.length = 0;

        // show/hide mega grid
        if (s === 5) {
          megaLines.visible = true;
          focalGroup.visible = false;
          activeCount = 0;
          // reset live-measurement window
          eventsThisWindow = 0;
          windowStartMs = now;
          // Start with a fully-black color buffer; cells light up as the
          // fill sweeps through and regenerateCell writes per-frame colors.
          const colArr = (megaGeom.attributes.color as THREE.BufferAttribute)
            .array as Float32Array;
          colArr.fill(0);
        } else {
          megaLines.visible = false;
          focalGroup.visible = true;
        }

        // set burst duration for Hz steps
        if (meta.hz !== null) {
          burstDurFrames = Math.max(4, Math.round(60 / meta.hz * 0.75));
        }

        // counter label
        const counts = [1, 2, 5, 10, 1000, 40_000_000];
        if (counterRef.current) counterRef.current.textContent = counts[s].toLocaleString();
      }

      // ── protons (step 0 only) ────────────────────────────────────────────
      // Wait PROTON_START_DELAY frames so the paper-roll overlay finishes
      // rolling in before the protons begin their approach.
      if (s === 0) {
        if (frame <= PROTON_START_DELAY) {
          // Fade protons in over the last ~12 frames of the wait so they don't
          // pop into existence once the paper has rolled up.
          const fadeIn = Math.min(1, (frame - (PROTON_START_DELAY - 12)) / 12);
          for (const p of protons) p.mat.opacity = Math.max(0, fadeIn) * 0.95;
        } else {
          for (let i = protons.length - 1; i >= 0; i--) {
            const p = protons[i];
            p.age++;
            const t = Math.min(1, p.age / PROTON_DURATION);
            // ease-out: fast start, decelerate near collision
            const te = 1 - (1 - t) * (1 - t);
            const startX = p.fromLeft ? -viewW / 2 : viewW / 2;
            p.mesh.position.x = startX * (1 - te);
            p.mat.opacity = 1 - te * 0.4;
            if (t >= 1) {
              focalGroup.remove(p.mesh);
              p.mesh.geometry.dispose();
              p.mat.dispose();
              protons.splice(i, 1);
              protDone = true;
            }
          }
          if (protDone && !firstBurst) {
            firstBurst = true;
            addFocalBurst();
          }
        }
      }

      // ── Hz-based burst spawning (steps 1–4) ─────────────────────────────
      // `while` (not `if`) so that at 1 kHz, where interval=1 ms and RAF only
      // fires every ~16 ms, we spawn ~16 bursts per frame instead of 1. Cap at
      // 24/frame as a safety net against runaway tabs.
      if (s >= 1 && s <= 4 && meta.hz !== null) {
        const interval = 1000 / meta.hz;
        let spawns = 0;
        while (now - lastBurstMs >= interval && spawns < 24) {
          lastBurstMs += interval;
          addFocalBurst();
          spawns++;
        }
      }

      // ── fade/cull focal events ────────────────────────────────────────────
      for (let i = focal.length - 1; i >= 0; i--) {
        const e = focal[i];
        e.age++;
        const lifeT = Math.min(1, e.age / e.life);
        e.mat.opacity = (1 - lifeT * lifeT) * (s === 0 ? 0.95 : 0.85);
        if (lifeT >= 1) {
          focalGroup.remove(e.lines);
          e.geom.dispose();
          e.mat.dispose();
          focal.splice(i, 1);
        }
      }

      // ── beam opacity ─────────────────────────────────────────────────────
      const beamTarget = s >= 5 ? 0.0 : s >= 3 ? 0.12 : 0.55;
      beamMat.opacity += (beamTarget - beamMat.opacity) * 0.06;

      // ── mega-grid (step 5) ────────────────────────────────────────────────
      if (s === 5) {
        // progressive fill
        if (activeCount < totalCells) {
          activeCount = Math.min(totalCells, activeCount + FILL_RATE);
        }

        const posAttr = megaGeom.attributes.position as THREE.BufferAttribute;
        const colAttr = megaGeom.attributes.color    as THREE.BufferAttribute;
        const posArr  = posAttr.array as Float32Array;
        const colArr  = colAttr.array as Float32Array;

        // Fire-rate 0.95 × N cells × 60 Hz = effective event throughput.
        let fired = 0;
        for (let cell = 0; cell < activeCount; cell++) {
          if (Math.random() < 0.95) {
            const cx = cellCenters[cell * 2];
            const cy = cellCenters[cell * 2 + 1];
            regenerateCell(cell, cx, cy, megaScale, posArr, colArr);
            fired++;
          } else {
            const base = cell * VPP_CELL * 3;
            colArr[base]     = 0; colArr[base + 1] = 0; colArr[base + 2] = 0;
            colArr[base + 3] = 0; colArr[base + 4] = 0; colArr[base + 5] = 0;
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        // Rolling-window rate measurement — displays actual events/sec.
        eventsThisWindow += fired;
        const windowMs = now - windowStartMs;
        if (windowMs >= 500) {
          const eps = Math.round((eventsThisWindow * 1000) / windowMs);
          if (counterRef.current) counterRef.current.textContent = eps.toLocaleString();
          eventsThisWindow = 0;
          windowStartMs = now;
        }
      }

      // ── counter jitter for 1000Hz ─────────────────────────────────────────
      // Step 4's while-loop in spawner runs at ~1 kHz steady state; a small
      // jitter here just stops the digit from standing perfectly still.
      if (s === 4 && counterRef.current && frame % 3 === 0) {
        const j = Math.floor(Math.random() * 20);
        counterRef.current.textContent = (1000 + j).toLocaleString();
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      renderer.setSize(nw, nh);
      const a = nw / nh;
      camera.left   = (-viewH * a) / 2;
      camera.right  = (viewH * a) / 2;
      camera.top    = viewH / 2;
      camera.bottom = -viewH / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const canvasEl = renderer.domElement;
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      focal.forEach((e) => { e.geom.dispose(); e.mat.dispose(); });
      protons.forEach((p) => { p.mesh.geometry.dispose(); p.mat.dispose(); });
      beamGeom.dispose(); beamMat.dispose();
      megaGeom.dispose(); megaMat.dispose();
      renderer.dispose();
      if (canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9, delay: 0.1 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col justify-between p-10 md:p-14 pointer-events-none">
        <div className="flex items-start justify-between">
          <div>
          </div>
          <div className="text-right font-mono">
            <div className="text-sky-300/70 text-[11px] uppercase tracking-[0.25em]">events / second</div>
            <div className="text-zinc-100 text-[clamp(56px,7vw,128px)] font-serif italic leading-[0.95] tabular-nums mt-1">
              <span ref={counterRef}>1</span>
            </div>
            <div className="text-zinc-400 text-[14px] mt-2 font-mono"><span ref={labelRef}>one collision</span></div>
            <div className="text-zinc-500 text-[13px] font-mono"><span ref={subRef}>every 25 nanoseconds</span></div>
          </div>
        </div>

        <div className="max-w-[640px] font-serif italic text-zinc-400 text-[clamp(15px,1.2vw,19px)] leading-snug">
          every 25 nanoseconds, the beams cross.
        </div>
      </div>
    </motion.div>
  );
}
