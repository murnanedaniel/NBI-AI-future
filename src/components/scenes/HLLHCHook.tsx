"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type EventSpec = {
  origin: THREE.Vector3;
  hitCount: number;
  trackCount: number;
};

function buildTracks(origin: THREE.Vector3, count: number) {
  const segments = 18;
  const positions = new Float32Array(count * segments * 2 * 3);
  const colors = new Float32Array(count * segments * 2 * 3);
  let p = 0;
  let c = 0;

  for (let i = 0; i < count; i++) {
    const phi = Math.random() * Math.PI * 2;
    const eta = (Math.random() - 0.5) * 3.5;
    const theta = 2 * Math.atan(Math.exp(-eta));
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const dirX = sinT * Math.cos(phi);
    const dirY = cosT;
    const dirZ = sinT * Math.sin(phi);

    const pt = Math.max(0.4, -Math.log(1 - Math.random()) * 1.2);
    const curvature = (Math.random() < 0.5 ? 1 : -1) * 0.012 / Math.max(0.5, pt);
    const length = 3.4 + Math.min(pt, 5) * 0.6;
    const perpX = -dirZ;
    const perpZ = dirX;

    const bright = 0.35 + Math.min(1.0, pt * 0.35);
    const cr = bright * (0.55 + 0.25 * Math.random());
    const cg = bright * (0.9 + 0.1 * Math.random());
    const cb = bright * 1.0;

    let prevX = origin.x;
    let prevY = origin.y;
    let prevZ = origin.z;

    for (let s = 1; s <= segments; s++) {
      const t = (s / segments) * length;
      const bend = curvature * t * t;
      const x = origin.x + dirX * t + perpX * bend;
      const y = origin.y + dirY * t;
      const z = origin.z + dirZ * t + perpZ * bend;

      positions[p++] = prevX;
      positions[p++] = prevY;
      positions[p++] = prevZ;
      positions[p++] = x;
      positions[p++] = y;
      positions[p++] = z;

      colors[c++] = cr; colors[c++] = cg; colors[c++] = cb;
      colors[c++] = cr; colors[c++] = cg; colors[c++] = cb;

      prevX = x; prevY = y; prevZ = z;
    }
  }
  return { positions, colors };
}

function buildHits(origin: THREE.Vector3, count: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * 8);
    const r = 0.6 + layer * 0.55 + (Math.random() - 0.5) * 0.12;
    const phi = Math.random() * Math.PI * 2;
    const z = origin.z + (Math.random() - 0.5) * 7;
    positions[i * 3 + 0] = origin.x + r * Math.cos(phi);
    positions[i * 3 + 1] = origin.y + r * Math.sin(phi) * 0.35 + (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

function addEvent(group: THREE.Group, spec: EventSpec) {
  const hitsGeom = new THREE.BufferGeometry();
  hitsGeom.setAttribute("position", new THREE.BufferAttribute(buildHits(spec.origin, spec.hitCount), 3));
  const hitsMat = new THREE.PointsMaterial({
    size: 0.018,
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.32,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const hits = new THREE.Points(hitsGeom, hitsMat);
  group.add(hits);

  const tracksData = buildTracks(spec.origin, spec.trackCount);
  const tracksGeom = new THREE.BufferGeometry();
  tracksGeom.setAttribute("position", new THREE.BufferAttribute(tracksData.positions, 3));
  tracksGeom.setAttribute("color", new THREE.BufferAttribute(tracksData.colors, 3));
  const tracksMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tracks = new THREE.LineSegments(tracksGeom, tracksMat);
  group.add(tracks);

  return { hits, tracks };
}

export function HLLHCHook() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const eventsRef = useRef<HTMLSpanElement | null>(null);
  const tracksRef = useRef<HTMLSpanElement | null>(null);
  const hitsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050607, 0.028);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 400);
    camera.position.set(0, 1.0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x050607, 1);
    mount.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const disposables: THREE.Object3D[] = [];
    let totalHits = 0;
    let totalTracks = 0;
    let eventCount = 0;

    const spawnEvent = (spec: EventSpec) => {
      const { hits, tracks } = addEvent(worldGroup, spec);
      disposables.push(hits, tracks);
      totalHits += spec.hitCount;
      totalTracks += spec.trackCount;
      eventCount += 1;
    };

    spawnEvent({ origin: new THREE.Vector3(0, 0, 0), hitCount: 100_000, trackCount: 2000 });

    const start = performance.now();
    let lastSpawn = 0;
    let raf = 0;
    let mounted = true;

    const animate = () => {
      if (!mounted) return;
      const tSec = (performance.now() - start) / 1000;

      const pullback = Math.max(0, Math.min(1, (tSec - 2.5) / 6));
      const ease = pullback * pullback * (3 - 2 * pullback);
      camera.position.set(0, 1.0 + ease * 4, 10 + ease * 26);
      camera.lookAt(0, 0, ease * 4);

      if (tSec > 2.5 && tSec - lastSpawn > 0.07 && eventCount < 80) {
        lastSpawn = tSec;
        const zSpread = 10 + 35 * ease;
        spawnEvent({
          origin: new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * zSpread,
          ),
          hitCount: 4500,
          trackCount: 60,
        });
      }

      worldGroup.rotation.y = tSec * 0.018;

      const nsPerSecond = 2500;
      const bcTime = tSec < 2.5 ? 0 : Math.floor((tSec - 2.5) * nsPerSecond);
      if (timeRef.current) timeRef.current.textContent = `${bcTime.toLocaleString()} ns`;
      if (eventsRef.current) eventsRef.current.textContent = eventCount.toLocaleString();
      if (hitsRef.current) hitsRef.current.textContent = totalHits.toLocaleString();
      if (tracksRef.current) tracksRef.current.textContent = totalTracks.toLocaleString();

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const canvasEl = renderer.domElement;

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      for (const obj of disposables) {
        if (obj instanceof THREE.Points || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      }
      renderer.dispose();
      if (canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 vignette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.0, delay: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      <div ref={mountRef} className="absolute inset-0" />

      <motion.div
        className="absolute inset-0 flex flex-col justify-between p-10 md:p-14 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 1.0, delay: 1.2 } }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · The box</div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 text-right space-y-0.5 tabular-nums">
            <div className="text-sky-300/80">HL-LHC · ATLAS ITk</div>
            <div>⟨μ⟩ ≈ 200 · 25 ns · 40 MHz</div>
            <div className="pt-2 mt-1 border-t border-white/10 space-y-0.5">
              <div>t <span className="text-zinc-300" ref={timeRef}>0 ns</span></div>
              <div>crossings <span className="text-zinc-300" ref={eventsRef}>1</span></div>
              <div>hits <span className="text-zinc-300" ref={hitsRef}>100,000</span></div>
              <div>tracks <span className="text-zinc-300" ref={tracksRef}>2,000</span></div>
            </div>
          </div>
        </div>

        <div className="max-w-[640px]">
          <div className="text-zinc-400 font-serif italic text-[clamp(18px,1.7vw,26px)] leading-tight">
            hundreds of thousands of hits.
            <br />
            two thousand tracks to find.
            <br />
            forty million times a second.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
