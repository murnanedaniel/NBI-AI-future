"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type StepConfig = {
  label: string;
  sub: string;
  spawnsPerFrame: number;
  eventLifeFrames: number;
  gridSize: number; // 0 means single focal event, N means N×N grid
  focalOpacity: number;
};

const STEPS: StepConfig[] = [
  { label: "one collision",       sub: "25 nanoseconds apart",       spawnsPerFrame: 0.0,  eventLifeFrames: 9999, gridSize: 0,  focalOpacity: 1.0 },
  { label: "1,000 per second",    sub: "you can still see them",     spawnsPerFrame: 0.7,  eventLifeFrames: 90,   gridSize: 0,  focalOpacity: 0.9 },
  { label: "100,000 per second",  sub: "too fast",                   spawnsPerFrame: 2.0,  eventLifeFrames: 30,   gridSize: 8,  focalOpacity: 0.35 },
  { label: "40,000,000 per second", sub: "per second. every second.", spawnsPerFrame: 14.0, eventLifeFrames: 14,   gridSize: 20, focalOpacity: 0.15 },
];

const BEAM_Y = 0;
const FOCAL_SCALE_DEFAULT = 1.6;
const TRACKS_PER_EVENT = 22;
const SEGMENTS_PER_TRACK = 6;

type EventEntry = {
  lines: THREE.LineSegments;
  geom: THREE.BufferGeometry;
  mat: THREE.LineBasicMaterial;
  age: number;
  life: number;
};

function buildBurst(scale: number) {
  const positions = new Float32Array(TRACKS_PER_EVENT * SEGMENTS_PER_TRACK * 2 * 3);
  const colors = new Float32Array(TRACKS_PER_EVENT * SEGMENTS_PER_TRACK * 2 * 3);
  let p = 0;
  let c = 0;
  for (let t = 0; t < TRACKS_PER_EVENT; t++) {
    const phi = Math.random() * Math.PI * 2;
    const eta = (Math.random() - 0.5) * 2.5;
    const theta = 2 * Math.atan(Math.exp(-eta));
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const dirX = sinT * Math.cos(phi);
    const dirY = cosT;
    const dirZ = sinT * Math.sin(phi);
    const len = scale * (0.9 + Math.random() * 0.6);
    let px = 0, py = 0, pz = 0;
    const bright = 0.45 + Math.random() * 0.55;
    const rC = bright * 0.55;
    const gC = bright * 0.92;
    const bC = bright;
    for (let s = 1; s <= SEGMENTS_PER_TRACK; s++) {
      const tt = (s / SEGMENTS_PER_TRACK) * len;
      const x = dirX * tt;
      const y = dirY * tt;
      const z = dirZ * tt;
      positions[p++] = px; positions[p++] = py; positions[p++] = pz;
      positions[p++] = x;  positions[p++] = y;  positions[p++] = z;
      colors[c++] = rC; colors[c++] = gC; colors[c++] = bC;
      colors[c++] = rC; colors[c++] = gC; colors[c++] = bC;
      px = x; py = y; pz = z;
    }
  }
  return { positions, colors };
}

function makeEvent(x: number, y: number, z: number, scale: number, lifeFrames: number): EventEntry {
  const { positions, colors } = buildBurst(scale);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geom, mat);
  lines.position.set(x, y, z);
  return { lines, geom, mat, age: 0, life: lifeFrames };
}

type ProtonEntry = {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  startX: number;
  endX: number;
  duration: number;
  age: number;
};

function makeProton(fromLeft: boolean): ProtonEntry {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.95,
  });
  const geom = new THREE.SphereGeometry(0.08, 10, 10);
  const mesh = new THREE.Mesh(geom, mat);
  const startX = fromLeft ? -12 : 12;
  const endX = 0;
  mesh.position.set(startX, BEAM_Y, 0);
  return { mesh, mat, startX, endX, duration: 28, age: 0 };
}

export function RateRamp({ step }: { step: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(step);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const subRef = useRef<HTMLSpanElement | null>(null);
  const eventsPerSecRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const phase = STEPS[Math.min(STEPS.length - 1, Math.max(0, step))];
    if (labelRef.current) labelRef.current.textContent = phase.label;
    if (subRef.current) subRef.current.textContent = phase.sub;
  }, [step]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();

    // orthographic top-down camera for 2D-like grid layout
    const aspect = w / h;
    const viewHeight = 18;
    const camera = new THREE.OrthographicCamera(
      (-viewHeight * aspect) / 2,
      (viewHeight * aspect) / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      200,
    );
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x050607, 1);
    mount.appendChild(renderer.domElement);

    // beamline geometry (stays through steps 0–1, hides for 2–3)
    const beamGeom = new THREE.BufferGeometry();
    beamGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([-15, BEAM_Y, 0, 15, BEAM_Y, 0]),
        3,
      ),
    );
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.LineSegments(beamGeom, beamMat);
    scene.add(beam);

    // focal event pivot (step 0/1) — moves to top-left corner at step 2+
    const focalGroup = new THREE.Group();
    scene.add(focalGroup);

    const focal: EventEntry[] = [];
    const gridEvents: EventEntry[] = [];
    const protons: ProtonEntry[] = [];

    // seed first collision for step 0 after a short proton run
    let firstBurstDone = false;
    let protonAccum = 0;
    let spawnAccum = 0;
    let gridFrame = 0;

    const addFocalBurst = () => {
      const e = makeEvent(0, BEAM_Y, 0, FOCAL_SCALE_DEFAULT, STEPS[stepRef.current]?.eventLifeFrames ?? 60);
      focalGroup.add(e.lines);
      focal.push(e);
    };

    const spawnProtons = () => {
      const a = makeProton(true);
      const b = makeProton(false);
      focalGroup.add(a.mesh, b.mesh);
      protons.push(a, b);
    };

    spawnProtons();

    const gridPositions = (n: number): { x: number; y: number }[] => {
      if (n === 0) return [];
      const aspectRatio = w / h;
      const viewW = viewHeight * aspectRatio;
      const cellW = viewW / (n + 1.2);
      const cellH = viewHeight / (n + 1.2);
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < n; i++) {
        xs.push(-viewW / 2 + cellW * (i + 1) + cellW * 0.1);
        ys.push(-viewHeight / 2 + cellH * (i + 1) + cellH * 0.1);
      }
      const pts: { x: number; y: number }[] = [];
      for (const x of xs) for (const y of ys) pts.push({ x, y });
      return pts;
    };

    let raf = 0;
    let alive = true;
    let prevStep = -1;
    let prevGridSize = -1;
    let focalTarget = { x: 0, y: 0, scale: 1 };

    const animate = () => {
      if (!alive) return;
      const s = Math.min(STEPS.length - 1, Math.max(0, stepRef.current));
      const phase = STEPS[s];
      gridFrame++;

      // step change housekeeping
      if (s !== prevStep) {
        prevStep = s;
        if (s === 0) {
          focalTarget = { x: 0, y: 0, scale: 1 };
        } else if (s === 1) {
          focalTarget = { x: 0, y: 0, scale: 0.8 };
        } else if (s === 2) {
          focalTarget = { x: -7.5, y: 5.0, scale: 0.35 };
        } else {
          focalTarget = { x: -8.2, y: 5.3, scale: 0.22 };
        }
      }

      // ease focal group toward target position+scale
      focalGroup.position.x += (focalTarget.x - focalGroup.position.x) * 0.08;
      focalGroup.position.y += (focalTarget.y - focalGroup.position.y) * 0.08;
      const targetScale = focalTarget.scale;
      focalGroup.scale.x += (targetScale - focalGroup.scale.x) * 0.08;
      focalGroup.scale.y = focalGroup.scale.x;
      focalGroup.scale.z = focalGroup.scale.x;

      // beam fades out as grid takes over
      const beamTargetOpacity = s >= 2 ? 0.12 : 0.55;
      beamMat.opacity += (beamTargetOpacity - beamMat.opacity) * 0.06;

      // step 0: fire protons once, then burst, then hold
      if (s === 0) {
        for (let i = protons.length - 1; i >= 0; i--) {
          const p = protons[i];
          p.age++;
          const t = Math.min(1, p.age / p.duration);
          p.mesh.position.x = p.startX + (p.endX - p.startX) * t;
          p.mat.opacity = 1 - t * 0.4;
          if (t >= 1) {
            focalGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mat.dispose();
            protons.splice(i, 1);
          }
        }
        if (!firstBurstDone && protons.length === 0) {
          firstBurstDone = true;
          addFocalBurst();
        }
      }

      // step 1+: spawn at focal position
      if (s >= 1) {
        spawnAccum += phase.spawnsPerFrame;
        while (spawnAccum >= 1 && focal.length < 40) {
          spawnAccum -= 1;
          addFocalBurst();
        }
      }

      // step 2+: spawn at grid positions
      if (s >= 2) {
        if (phase.gridSize !== prevGridSize) {
          prevGridSize = phase.gridSize;
        }
        const pts = gridPositions(phase.gridSize);
        const spawnCount = Math.max(1, Math.floor(phase.spawnsPerFrame * 1.5));
        for (let k = 0; k < spawnCount; k++) {
          const pt = pts[Math.floor(Math.random() * pts.length)];
          if (!pt) break;
          const scale = 0.45 + Math.random() * 0.3;
          const e = makeEvent(pt.x, pt.y, 0, scale, phase.eventLifeFrames);
          scene.add(e.lines);
          gridEvents.push(e);
        }
      }

      // fade + cull focal events
      for (let i = focal.length - 1; i >= 0; i--) {
        const e = focal[i];
        e.age++;
        const lifeT = Math.min(1, e.age / e.life);
        e.mat.opacity = (1 - lifeT * lifeT) * phase.focalOpacity;
        if (lifeT >= 1) {
          focalGroup.remove(e.lines);
          e.geom.dispose();
          e.mat.dispose();
          focal.splice(i, 1);
        }
      }

      // fade + cull grid events (hard cap to keep perf)
      const maxGrid = 2200;
      while (gridEvents.length > maxGrid) {
        const e = gridEvents.shift();
        if (!e) break;
        scene.remove(e.lines);
        e.geom.dispose();
        e.mat.dispose();
      }
      for (let i = gridEvents.length - 1; i >= 0; i--) {
        const e = gridEvents[i];
        e.age++;
        const lifeT = Math.min(1, e.age / e.life);
        e.mat.opacity = 0.95 * (1 - lifeT * lifeT);
        if (lifeT >= 1) {
          scene.remove(e.lines);
          e.geom.dispose();
          e.mat.dispose();
          gridEvents.splice(i, 1);
        }
      }

      // step 3: shake effect + high-rate counter refresh
      if (eventsPerSecRef.current && s >= 1) {
        const counts = [0, 1000, 100_000, 40_000_000];
        const n = counts[s];
        if (gridFrame % 3 === 0) {
          const jitter = s === 3 ? Math.floor(Math.random() * 200_000) : 0;
          eventsPerSecRef.current.textContent = (n + jitter).toLocaleString();
        }
      } else if (eventsPerSecRef.current && s === 0) {
        eventsPerSecRef.current.textContent = "1";
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
      camera.left = (-viewHeight * a) / 2;
      camera.right = (viewHeight * a) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const canvasEl = renderer.domElement;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      focal.forEach((e) => { e.geom.dispose(); e.mat.dispose(); });
      gridEvents.forEach((e) => { e.geom.dispose(); e.mat.dispose(); });
      protons.forEach((p) => { p.mesh.geometry.dispose(); p.mat.dispose(); });
      beamGeom.dispose();
      beamMat.dispose();
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
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · the firehose</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-sky-300/70 text-[10px] uppercase tracking-wider">events / second</div>
            <div className="text-zinc-100 text-[clamp(28px,3.4vw,56px)] font-serif italic leading-tight tabular-nums">
              <span ref={eventsPerSecRef}>1</span>
            </div>
            <div className="text-zinc-500 text-[11px] mt-1 font-mono">
              <span ref={labelRef}>one collision</span>
            </div>
            <div className="text-zinc-600 text-[11px] font-mono">
              <span ref={subRef}>25 nanoseconds apart</span>
            </div>
          </div>
        </div>

        <div className="max-w-[640px] font-serif italic text-zinc-400 text-[clamp(15px,1.2vw,19px)] leading-snug">
          every 25 nanoseconds, the beams cross.
        </div>
      </div>
    </motion.div>
  );
}
