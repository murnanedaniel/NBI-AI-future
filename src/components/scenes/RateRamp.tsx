"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type Phase = { label: string; sub: string; perFrameSpawn: number; lifespanFrames: number };

const PHASES: Phase[] = [
  { label: "1 per bunch crossing",    sub: "one pp collision · 25 ns ago",  perFrameSpawn: 0.0,  lifespanFrames: 9999 },
  { label: "40 per microsecond",      sub: "still countable",               perFrameSpawn: 0.35, lifespanFrames: 240 },
  { label: "40,000 per millisecond",  sub: "too fast",                      perFrameSpawn: 4.0,  lifespanFrames: 120 },
  { label: "40,000,000 per second",   sub: "per second",                    perFrameSpawn: 14.0, lifespanFrames: 70 },
];

type EventEntry = {
  group: THREE.Group;
  material: THREE.Material[];
  geometry: THREE.BufferGeometry[];
  age: number;
  lifespan: number;
};

function randomEvent(): { positions: Float32Array; colors: Float32Array } {
  const segments = 10;
  const tracks = 30;
  const pos = new Float32Array(tracks * segments * 2 * 3);
  const col = new Float32Array(tracks * segments * 2 * 3);
  let p = 0, c = 0;
  for (let i = 0; i < tracks; i++) {
    const phi = Math.random() * Math.PI * 2;
    const eta = (Math.random() - 0.5) * 3;
    const theta = 2 * Math.atan(Math.exp(-eta));
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const dirX = sinT * Math.cos(phi);
    const dirY = cosT;
    const dirZ = sinT * Math.sin(phi);
    const len = 3 + Math.random() * 2;
    let px = 0, py = 0, pz = 0;
    const bright = 0.5 + Math.random() * 0.5;
    for (let s = 1; s <= segments; s++) {
      const t = (s / segments) * len;
      const x = dirX * t;
      const y = dirY * t;
      const z = dirZ * t;
      pos[p++] = px; pos[p++] = py; pos[p++] = pz;
      pos[p++] = x;  pos[p++] = y;  pos[p++] = z;
      col[c++] = bright * 0.55; col[c++] = bright * 0.9; col[c++] = bright;
      col[c++] = bright * 0.55; col[c++] = bright * 0.9; col[c++] = bright;
      px = x; py = y; pz = z;
    }
  }
  return { positions: pos, colors: col };
}

function addEvent(scene: THREE.Scene, x: number, y: number, z: number, lifespan: number): EventEntry {
  const { positions, colors } = randomEvent();
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
  const group = new THREE.Group();
  group.add(lines);
  scene.add(group);
  return { group, material: [mat], geometry: [geom], age: 0, lifespan };
}

export function RateRamp({ step }: { step: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(step);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const subRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050607, 0.05);

    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 200);
    camera.position.set(0, 0.6, 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x050607, 1);
    mount.appendChild(renderer.domElement);

    const events: EventEntry[] = [];

    // seed event for step 0
    events.push(addEvent(scene, 0, 0, 0, PHASES[0].lifespanFrames));

    let raf = 0;
    let alive = true;
    let spawnAccum = 0;

    const animate = () => {
      if (!alive) return;
      const s = Math.min(PHASES.length - 1, Math.max(0, stepRef.current));
      const phase = PHASES[s];

      if (s > 0) {
        spawnAccum += phase.perFrameSpawn;
        while (spawnAccum >= 1 && events.length < 260) {
          spawnAccum -= 1;
          const radius = 3.5 + Math.random() * 1.2;
          const angle = Math.random() * Math.PI * 2;
          const yJitter = (Math.random() - 0.5) * 2.4;
          const x = Math.cos(angle) * radius;
          const y = yJitter;
          const z = Math.sin(angle) * radius * 0.7;
          events.push(addEvent(scene, x, y, z, phase.lifespanFrames));
        }
      }

      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        e.age++;
        const life = e.age / e.lifespan;
        const mat = e.material[0] as THREE.LineBasicMaterial;
        if (life > 1) {
          scene.remove(e.group);
          e.geometry.forEach((g) => g.dispose());
          e.material.forEach((m) => m.dispose());
          events.splice(i, 1);
          continue;
        }
        if (s === 0) {
          mat.opacity = Math.min(0.9, e.age / 30);
        } else {
          mat.opacity = 0.95 * (1 - life * life);
        }
      }

      scene.rotation.y = (performance.now() / 1000) * 0.03;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const canvasEl = renderer.domElement;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      events.forEach((e) => {
        e.geometry.forEach((g) => g.dispose());
        e.material.forEach((m) => m.dispose());
      });
      renderer.dispose();
      if (canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
    };
  }, []);

  useEffect(() => {
    const phase = PHASES[Math.min(PHASES.length - 1, Math.max(0, step))];
    if (labelRef.current) labelRef.current.textContent = phase.label;
    if (subRef.current) subRef.current.textContent = phase.sub;
  }, [step]);

  return (
    <motion.div
      className="absolute inset-0 vignette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col justify-between p-10 md:p-14 pointer-events-none">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · the firehose</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-sky-300/70 text-[10px] uppercase tracking-wider">rate</div>
            <div className="text-zinc-100 text-[clamp(24px,2.6vw,40px)] font-serif italic leading-tight">
              <span ref={labelRef}>1 per bunch crossing</span>
            </div>
            <div className="text-zinc-400 text-[12px] mt-1 font-mono">
              <span ref={subRef}>one pp collision · 25 ns ago</span>
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
