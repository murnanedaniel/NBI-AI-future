"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import graphData from "@/data/nbi_research_graph.json";
import { sectionColor } from "@/lib/sectionColors";
import { WINNING_PAIR } from "@/lib/winningPair";

type Node = {
  id: string;
  name: string;
  section: string;
  rank: string;
  title: string;
  x: number;
  y: number;
  z: number;
  has_p: boolean;
  has_w: boolean;
  valid: boolean;
  p_text: string;
  w_text: string;
};

type Edge = {
  source: string;
  target: string;
  w_sim: number;
  p_sim: number;
  score: number;
  mutual: boolean;
};

type Graph = { nodes: Node[]; edges: Edge[]; meta: Record<string, unknown> };

const graph = graphData as unknown as Graph;

type Phase =
  | "idle"
  | "sectionsRoulette"
  | "sectionsLock"
  | "facultyRoulette"
  | "facultyLock";

const WINNER_A = WINNING_PAIR.a.id;
const WINNER_B = WINNING_PAIR.b.id;
const SECTION_A = WINNING_PAIR.a.section;
const SECTION_B = WINNING_PAIR.b.section;

export function NbiGraph({
  step,
  onAdvance,
}: {
  step: number;
  onAdvance?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(step);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [spotSections, setSpotSections] = useState<[string, string] | null>(null);
  const [spotNodes, setSpotNodes] = useState<[string, string] | null>(null);
  const spotSectionsRef = useRef<[string, string] | null>(null);
  const spotNodesRef = useRef<[string, string] | null>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    spotSectionsRef.current = spotSections;
  }, [spotSections]);
  useEffect(() => {
    spotNodesRef.current = spotNodes;
  }, [spotNodes]);

  const sections = useMemo(() => {
    const bySec = new Map<string, Node[]>();
    for (const n of graph.nodes) {
      if (!n.valid) continue;
      const arr = bySec.get(n.section) ?? [];
      arr.push(n);
      bySec.set(n.section, arr);
    }
    return bySec;
  }, []);
  const sectionNames = useMemo(() => Array.from(sections.keys()), [sections]);

  const nodeById = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n])),
    [],
  );

  // phase progression driven by step (steps 0 idle, 1 section roulette, 2 faculty roulette)
  useEffect(() => {
    if (step === 0) setPhase("idle");
    else if (step === 1) setPhase("sectionsRoulette");
    else if (step >= 2) setPhase("facultyRoulette");
  }, [step]);

  // section roulette
  useEffect(() => {
    if (phase !== "sectionsRoulette") return;
    const start = performance.now();
    const duration = 3000;
    const others = sectionNames.filter((s) => s !== SECTION_A && s !== SECTION_B);

    function pick() {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);
      // eased tick interval: 80ms → 360ms
      const interval = 80 + (360 - 80) * (t * t);
      if (t >= 1) {
        setSpotSections([SECTION_A, SECTION_B]);
        window.setTimeout(() => setPhase("sectionsLock"), 700);
        return;
      }
      // random pair, biased to include final sections in last 30%
      let a: string;
      let b: string;
      if (t > 0.7 && Math.random() < 0.4) {
        a = SECTION_A;
        b = Math.random() < 0.5 ? SECTION_B : others[Math.floor(Math.random() * others.length)];
      } else {
        a = sectionNames[Math.floor(Math.random() * sectionNames.length)];
        do {
          b = sectionNames[Math.floor(Math.random() * sectionNames.length)];
        } while (b === a);
      }
      setSpotSections([a, b]);
      window.setTimeout(pick, interval);
    }
    pick();
  }, [phase, sectionNames]);

  // after sectionsLock, move to faculty phase on next step (user-driven);
  // but auto-advance if step ref is already 2
  useEffect(() => {
    if (phase !== "sectionsLock") return;
    const t = window.setTimeout(() => {
      if (stepRef.current >= 2) setPhase("facultyRoulette");
    }, 300);
    return () => window.clearTimeout(t);
  }, [phase]);

  // faculty roulette
  useEffect(() => {
    if (phase !== "facultyRoulette") return;
    const start = performance.now();
    const duration = 3000;
    const poolA = (sections.get(SECTION_A) ?? []).map((n) => n.id);
    const poolB = (sections.get(SECTION_B) ?? []).map((n) => n.id);
    if (poolA.length === 0 || poolB.length === 0) {
      setSpotNodes([WINNER_A, WINNER_B]);
      setPhase("facultyLock");
      return;
    }

    function pick() {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);
      const interval = 70 + (340 - 70) * (t * t);
      if (t >= 1) {
        setSpotNodes([WINNER_A, WINNER_B]);
        window.setTimeout(() => setPhase("facultyLock"), 800);
        return;
      }
      let a: string;
      let b: string;
      if (t > 0.7 && Math.random() < 0.5) {
        a = Math.random() < 0.6 ? WINNER_A : poolA[Math.floor(Math.random() * poolA.length)];
        b = Math.random() < 0.6 ? WINNER_B : poolB[Math.floor(Math.random() * poolB.length)];
      } else {
        a = poolA[Math.floor(Math.random() * poolA.length)];
        b = poolB[Math.floor(Math.random() * poolB.length)];
      }
      setSpotNodes([a, b]);
      window.setTimeout(pick, interval);
    }
    pick();
  }, [phase, sections]);

  // Three.js lifecycle
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.01, 100);
    camera.position.set(0, 0, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const nodeGeom = new THREE.SphereGeometry(1, 12, 10);
    const nodeGroup = new THREE.Group();
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeMatByIdx: THREE.MeshBasicMaterial[] = [];
    const nodeData = graph.nodes;

    nodeData.forEach((n) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(sectionColor(n.section, "light")),
        transparent: true,
        opacity: n.valid ? 1.0 : 0.3,
      });
      const mesh = new THREE.Mesh(nodeGeom, mat);
      const scale = 0.02;
      mesh.scale.set(scale, scale, scale);
      mesh.position.set((n.x - 0.5) * 1.8, (n.y - 0.5) * 1.8, (n.z - 0.5) * 1.8);
      mesh.userData = { idx: nodeMeshes.length, id: n.id };
      nodeMeshes.push(mesh);
      nodeMatByIdx.push(mat);
      nodeGroup.add(mesh);
    });
    root.add(nodeGroup);

    // edges — split into two LineSegments so we can control opacity
    // independently: bridges (mutual, orange, prominent) vs nearest-neighbour
    // (gray, faint background). Without this split the per-edge alpha array
    // can't drive visibility (LineBasicMaterial has a single global opacity).
    const edgeData = graph.edges;
    const bridges = edgeData.filter((e) => e.mutual && nodeById[e.source] && nodeById[e.target]);
    const nnEdges  = edgeData.filter((e) => !e.mutual && nodeById[e.source] && nodeById[e.target]);

    const buildLines = (
      list: typeof edgeData,
      hex: number,
      opacity: number,
    ) => {
      const positions = new Float32Array(list.length * 2 * 3);
      list.forEach((e, i) => {
        const a = nodeById[e.source];
        const b = nodeById[e.target];
        if (!a || !b) return;
        const ai = i * 6;
        positions[ai + 0] = (a.x - 0.5) * 1.8;
        positions[ai + 1] = (a.y - 0.5) * 1.8;
        positions[ai + 2] = (a.z - 0.5) * 1.8;
        positions[ai + 3] = (b.x - 0.5) * 1.8;
        positions[ai + 4] = (b.y - 0.5) * 1.8;
        positions[ai + 5] = (b.z - 0.5) * 1.8;
      });
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: hex,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      return { lines: new THREE.LineSegments(geom, mat), geom, mat };
    };

    // NN edges: low-contrast, faint, far from amber.
    const nnBuilt = buildLines(nnEdges, 0x4a4a4f, 0.18);
    nnBuilt.lines.renderOrder = 0;
    root.add(nnBuilt.lines);

    // Bridges: bright amber, much higher opacity. Render after NN so they
    // sit visually on top.
    const bridgeBuilt = buildLines(bridges, 0xfbbf24, 0.92);
    bridgeBuilt.lines.renderOrder = 1;
    root.add(bridgeBuilt.lines);

    // Glow halo: a second pass at lower opacity gives bridges visible
    // thickness even though linewidth is unsupported in WebGL.
    const bridgeHalo = buildLines(bridges, 0xfbbf24, 0.35);
    bridgeHalo.lines.renderOrder = 1;
    bridgeHalo.lines.scale.set(1.0, 1.0, 1.0);
    root.add(bridgeHalo.lines);

    // winner edge (drawn separately, becomes visible at facultyLock)
    const winnerA = nodeById[WINNER_A];
    const winnerB = nodeById[WINNER_B];
    const winnerGeom = new THREE.BufferGeometry();
    winnerGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          (winnerA.x - 0.5) * 1.8,
          (winnerA.y - 0.5) * 1.8,
          (winnerA.z - 0.5) * 1.8,
          (winnerB.x - 0.5) * 1.8,
          (winnerB.y - 0.5) * 1.8,
          (winnerB.z - 0.5) * 1.8,
        ]),
        3,
      ),
    );
    const winnerMat = new THREE.LineBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0,
      linewidth: 3,
    });
    const winnerLine = new THREE.LineSegments(winnerGeom, winnerMat);
    root.add(winnerLine);

    // Raycasting setup for hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-10, -10);

    // Interaction state
    let autoRotate = true;
    let lastInteraction = performance.now();
    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let cameraZ = camera.position.z;
    let cameraZTarget = camera.position.z;

    function onPointerDown(ev: PointerEvent) {
      if (ev.button !== 0) return;
      dragging = true;
      dragStart = { x: ev.clientX, y: ev.clientY };
      autoRotate = false;
      lastInteraction = performance.now();
      (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    }
    function onPointerMove(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      if (dragging) {
        const dx = ev.clientX - dragStart.x;
        const dy = ev.clientY - dragStart.y;
        root.rotation.y += dx * 0.007;
        root.rotation.x += dy * 0.007;
        root.rotation.x = Math.max(-1.2, Math.min(1.2, root.rotation.x));
        dragStart = { x: ev.clientX, y: ev.clientY };
        lastInteraction = performance.now();
      }
    }
    function onPointerUp() {
      dragging = false;
      lastInteraction = performance.now();
    }
    function onDoubleClick() {
      cameraZTarget = cameraZTarget > 2 ? 1.5 : 2.6;
      lastInteraction = performance.now();
    }
    function onResize() {
      const w = mount!.clientWidth;
      const h = mount!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);
    window.addEventListener("resize", onResize);

    let raf = 0;
    let lastT = performance.now();
    let hoverIdx: number | null = null;
    const tmpColor = new THREE.Color();

    function animate() {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;

      const phaseNow = phaseRef.current;

      if (now - lastInteraction > 1500) autoRotate = true;
      if (autoRotate) root.rotation.y += 0.08 * dt;

      cameraZ += (cameraZTarget - cameraZ) * Math.min(1, dt * 4);
      camera.position.z = cameraZ;

      // hover raycast
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes, false);
      const newHoverIdx = hits.length > 0 ? (hits[0].object.userData.idx as number) : null;
      if (newHoverIdx !== hoverIdx) {
        hoverIdx = newHoverIdx;
        setHoverId(hoverIdx !== null ? nodeData[hoverIdx].id : null);
      }

      // per-frame opacity + scale updates based on phase
      const spotSec = spotSectionsRef.current;
      const spotN = spotNodesRef.current;

      for (let i = 0; i < nodeMeshes.length; i++) {
        const n = nodeData[i];
        const mat = nodeMatByIdx[i];
        let targetOpacity = n.valid ? 0.95 : 0.3;
        let targetScale = 0.02;
        const col = new THREE.Color(sectionColor(n.section, "light"));

        if (phaseNow === "sectionsRoulette" || phaseNow === "sectionsLock") {
          if (spotSec && (n.section === spotSec[0] || n.section === spotSec[1])) {
            targetOpacity = 1.0;
            targetScale = 0.028;
          } else {
            targetOpacity = 0.12;
            targetScale = 0.016;
          }
        } else if (
          phaseNow === "facultyRoulette" ||
          phaseNow === "facultyLock"
        ) {
          const inSec = n.section === SECTION_A || n.section === SECTION_B;
          if (!inSec) {
            targetOpacity = 0.05;
            targetScale = 0.012;
          } else if (spotN && (n.id === spotN[0] || n.id === spotN[1])) {
            targetOpacity = 1.0;
            targetScale = 0.05;
          } else {
            targetOpacity = 0.35;
            targetScale = 0.018;
          }
        }

        if (i === hoverIdx && phaseNow === "idle") {
          targetScale *= 1.8;
          targetOpacity = 1.0;
        }
        // winning nodes get a steady pulse during lock
        if (
          (phaseNow === "facultyLock") &&
          (n.id === WINNER_A || n.id === WINNER_B)
        ) {
          const pulse = 1 + 0.25 * Math.sin(now * 0.006);
          targetScale = 0.05 * pulse;
        }

        mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, dt * 6);
        const s = mesh_scale(nodeMeshes[i]);
        const ns = s + (targetScale - s) * Math.min(1, dt * 6);
        nodeMeshes[i].scale.set(ns, ns, ns);

        tmpColor.copy(col);
        mat.color.lerp(tmpColor, 0.3);
      }

      // winner edge opacity
      const winnerTarget =
        phaseNow === "facultyLock" ? 0.9 : 0;
      winnerMat.opacity += (winnerTarget - winnerMat.opacity) * Math.min(1, dt * 4);

      // dim normal NN edges when locking; bridges stay prominent.
      const nnTarget =
        phaseNow === "facultyLock"
          ? 0.04
          : phaseNow === "facultyRoulette" || phaseNow === "sectionsLock"
            ? 0.10
            : 0.18;
      nnBuilt.mat.opacity += (nnTarget - nnBuilt.mat.opacity) * Math.min(1, dt * 3);

      const bridgeTarget = phaseNow === "facultyLock" ? 0.45 : 0.92;
      bridgeBuilt.mat.opacity += (bridgeTarget - bridgeBuilt.mat.opacity) * Math.min(1, dt * 3);
      bridgeHalo.mat.opacity += (bridgeTarget * 0.35 - bridgeHalo.mat.opacity) * Math.min(1, dt * 3);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("resize", onResize);
      nodeGeom.dispose();
      nnBuilt.geom.dispose(); nnBuilt.mat.dispose();
      bridgeBuilt.geom.dispose(); bridgeBuilt.mat.dispose();
      bridgeHalo.geom.dispose(); bridgeHalo.mat.dispose();
      winnerGeom.dispose();
      winnerMat.dispose();
      for (const m of nodeMatByIdx) m.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoveredNode = hoverId ? nodeById[hoverId] : null;
  const winnerA = nodeById[WINNER_A];
  const winnerB = nodeById[WINNER_B];

  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "var(--canvas)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.0, delay: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {/* HUD top-left */}
      <div className="absolute top-8 left-10 z-10 pointer-events-none max-w-md">
        <div className="text-[11px] uppercase tracking-[0.3em] text-sky-700/70 font-mono">
          124 NBI faculty · P + W embeddings
        </div>
        <div className="mt-2 font-serif italic text-ink text-[clamp(24px,2.8vw,38px)] leading-tight">
          Different backgrounds. Overlapping current work.
        </div>
        <div className="mt-2 font-mono text-[10px] text-ink/50">
          drag to rotate · dbl-click to zoom · hover for detail
        </div>
      </div>

      {/* Roulette button / phase indicator */}
      <div className="absolute top-8 right-10 z-10 font-mono text-[11px] text-ink/60 flex flex-col items-end gap-1">
        {phase === "idle" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance?.();
            }}
            className="bg-sky-700 text-paper ink-shadow rounded-full px-5 py-2.5 font-serif text-[15px] hover:bg-sky-800 transition-colors cursor-pointer"
          >
            ▷ Matchmake roulette
          </button>
        )}
        {phase === "sectionsRoulette" && <div>selecting section pair…</div>}
        {phase === "sectionsLock" && (
          <div className="flex flex-col items-end gap-2">
            <div className="text-sky-700 font-semibold text-[13px]">
              {spotSections?.[0]} × {spotSections?.[1]}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdvance?.();
              }}
              className="bg-sky-700 text-paper rounded-full px-4 py-1.5 font-mono text-[11px] hover:bg-sky-800 transition-colors cursor-pointer"
            >
              pick the pair →
            </button>
          </div>
        )}
        {phase === "facultyRoulette" && <div>selecting faculty pair…</div>}
        {phase === "facultyLock" && (
          <div className="flex flex-col items-end gap-2">
            <div className="text-sky-700 font-semibold text-[13px]">
              winning ticket
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdvance?.();
              }}
              className="bg-sky-700 text-paper rounded-full px-4 py-1.5 font-mono text-[11px] hover:bg-sky-800 transition-colors cursor-pointer"
            >
              ask Claude to draft →
            </button>
          </div>
        )}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {hoveredNode && phase === "idle" && (
          <motion.div
            key={hoveredNode.id}
            className="absolute bottom-8 left-10 z-20 max-w-md bg-paper/90 ink-shadow rounded-md p-4 pointer-events-none"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: sectionColor(hoveredNode.section, "light") }}
              />
              <span className="font-serif italic text-ink text-[18px]">
                {hoveredNode.name}
              </span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50 mt-0.5">
              {hoveredNode.title} · {hoveredNode.section}
            </div>
            <div className="mt-2 text-[12px] text-ink/75 leading-snug line-clamp-4">
              {hoveredNode.w_text || hoveredNode.p_text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner reveal cards */}
      <AnimatePresence>
        {phase === "facultyLock" && (
          <>
            <motion.div
              key="winnerA"
              className="absolute top-[38%] left-6 md:left-12 z-20 w-64"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <WinnerCard
                name={WINNING_PAIR.a.name}
                section={WINNING_PAIR.a.section}
                group={WINNING_PAIR.a.group}
                color={sectionColor(WINNING_PAIR.a.section, "light")}
              />
            </motion.div>
            <motion.div
              key="winnerB"
              className="absolute top-[38%] right-6 md:right-12 z-20 w-64"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <WinnerCard
                name={WINNING_PAIR.b.name}
                section={WINNING_PAIR.b.section}
                group={WINNING_PAIR.b.group}
                color={sectionColor(WINNING_PAIR.b.section, "light")}
                mirror
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* narrative text on lock */}
      <AnimatePresence>
        {phase === "facultyLock" && (
          <motion.div
            className="absolute bottom-10 inset-x-0 z-20 text-center font-serif italic text-ink/80 text-[clamp(20px,2.2vw,32px)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            &ldquo;{winnerA.name.split(" ").slice(-1)} & {winnerB.name.split(" ").slice(-1)}: Fe-bearing volcanic microtephra.&rdquo;
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function mesh_scale(mesh: THREE.Mesh): number {
  return mesh.scale.x;
}

function WinnerCard({
  name,
  section,
  group,
  color,
  mirror,
}: {
  name: string;
  section: string;
  group: string;
  color: string;
  mirror?: boolean;
}) {
  return (
    <div className={`bg-paper ink-shadow rounded-md p-4 ${mirror ? "text-right" : ""}`}>
      <div className={`flex items-center gap-3 ${mirror ? "flex-row-reverse" : ""}`}>
        <div
          className="h-10 w-10 rounded-full border-2 flex items-center justify-center font-serif italic"
          style={{ background: color + "20", borderColor: color, color }}
        >
          {name.split(" ")[0][0]}
        </div>
        <div className={mirror ? "text-right" : ""}>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/50">
            {section}
          </div>
          <div className="font-serif text-ink text-[17px] leading-tight">
            {name}
          </div>
        </div>
      </div>
      <div
        className={`mt-2 font-mono text-[10.5px] text-ink/60 leading-snug ${mirror ? "text-right" : ""}`}
      >
        {group}
      </div>
    </div>
  );
}
