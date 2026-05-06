"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";

// Real ATLAS ITk event 000008843 — x/y projection of the barrel slice
// (|z| < 1 m). Preprocessed in scripts/prep_tracking_event.py from the raw
// NPZ (which carries truth-track edges + per-particle pT + primary flag).
//
// Step 1 ("trace 10k particles") renders the *truth* track edges of every
// primary particle with pT > 1 GeV — there are ~1100 such tracks in this
// event. They reveal in r-rank order, inner detector outwards.
// Step 2 ("connect every nearby pair") fades in all 500k candidate edges.
// Step 3 ("message passing") converges the candidate sea: true edges keep
// their truth colour, false edges fade out.

const MAGIC = 0x54524147; // 'GART' little-endian
const N_ITERATIONS   = 10;              // visible "beats" during message passing
const PROP_DURATION_S  = 3.0;           // step 1: focus-track edges propagate in r
const STEP1_APPEAR_S   = 2.0;           // step 2: chaos edges fade in
const STEP2_DURATION_S = 5.0;           // step 3: message-passing convergence
const STEP3_SETTLE_S   = 1.0;           // (legacy) non-focus fade-down duration

type EventData = {
  nHits: number;
  nEdges: number;
  nFocusTracks: number;
  nFocusEdges: number;
  scaleMm: number;
  hits: Float32Array;
  edges: Uint32Array;
  edgeY: Uint8Array;
  trackIds: Int32Array;
  focusEdges: Uint32Array;
  focusEdgePid: Int32Array;
};

function parseBuffer(buf: ArrayBuffer): EventData {
  const dv = new DataView(buf);
  const magic = dv.getUint32(0, true);
  if (magic !== MAGIC) throw new Error(`bad magic: ${magic.toString(16)}`);
  const nHits        = dv.getUint32(4, true);
  const nEdges       = dv.getUint32(8, true);
  const nFocusTracks = dv.getUint32(12, true);
  const nFocusEdges  = dv.getUint32(16, true);
  const scaleMm      = dv.getFloat32(20, true);

  let off = 24;
  const hits = new Float32Array(buf, off, nHits * 2);
  off += nHits * 2 * 4;
  const edges = new Uint32Array(buf, off, nEdges * 2);
  off += nEdges * 2 * 4;
  const edgeY = new Uint8Array(buf, off, nEdges);
  off += nEdges;
  off = (off + 3) & ~3;
  const trackIds = new Int32Array(buf, off, nHits);
  off += nHits * 4;
  const focusEdges = new Uint32Array(buf, off, nFocusEdges * 2);
  off += nFocusEdges * 2 * 4;
  const focusEdgePid = new Int32Array(buf, off, nFocusEdges);
  return { nHits, nEdges, nFocusTracks, nFocusEdges, scaleMm,
           hits, edges, edgeY, trackIds, focusEdges, focusEdgePid };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

// Deterministic distinct colours indexed by dense focus-particle id —
// golden-angle hue spacing so neighbouring particles don't collide.
function focusColor(i: number): [number, number, number] {
  const hue = ((i * 137.508) % 360) / 360;
  return hslToRgb(hue, 0.72, 0.60);
}

// ── Focus shader: simple per-edge propagation in r-rank order ─────────────
const FOCUS_VERT = /* glsl */ `
  attribute vec3  aColor;
  attribute float aPropRank;
  varying vec3  vColor;
  varying float vPropRank;
  void main() {
    vColor = aColor;
    vPropRank = aPropRank;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FOCUS_FRAG = /* glsl */ `
  precision highp float;
  uniform float uPropagation;  // 0..1 step 1 reveal
  uniform float uHide;         // 0..1 fade focus edges out (step 3+ if desired)
  varying vec3  vColor;
  varying float vPropRank;
  void main() {
    float appeared = step(vPropRank, uPropagation);
    float alpha = 0.95 * appeared * (1.0 - uHide);
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ── Chaos shader: 500k candidate edges, message-passing convergence ────────
const CHAOS_VERT = /* glsl */ `
  attribute float aEdgeIdx;
  attribute vec3  aEndCol;
  attribute float aIsTrue;
  attribute float aIsFocus;
  varying float vEdgeIdx;
  varying vec3  vEndCol;
  varying float vIsTrue;
  varying float vIsFocus;
  void main() {
    vEdgeIdx  = aEdgeIdx;
    vEndCol   = aEndCol;
    vIsTrue   = aIsTrue;
    vIsFocus  = aIsFocus;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const CHAOS_FRAG = /* glsl */ `
  precision highp float;
  uniform float uT;            // 0..1 step 3 — message-passing convergence
  uniform float uBeat;         // 0..1 decaying spike at each iteration boundary
  uniform float uAppear;       // 0..1 step 2 — random per-edge fade-in
  varying float vEdgeIdx;
  varying vec3  vEndCol;
  varying float vIsTrue;
  varying float vIsFocus;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  float hash1(float n) { return fract(sin(n * 17.17) * 43758.5453); }

  void main() {
    float h = hash1(vEdgeIdx);
    vec3 startCol = hsv2rgb(vec3(h, 0.82, 0.88));
    float colorT = smoothstep(0.0, 1.0, uT);
    vec3 col = mix(startCol, vEndCol, colorT);
    col *= 1.0 + 0.30 * uBeat;

    float t = smoothstep(0.0, 1.0, uT);
    float A_CHAOS     = 0.26;
    float A_FALSE_END = 0.00;
    float A_TRUE_END  = 0.18;
    float A_FOCUS_END = 0.95;
    float aFalse = mix(A_CHAOS, A_FALSE_END, t);
    float aTrue  = mix(A_CHAOS, A_TRUE_END,  t);
    float aFocus = mix(A_CHAOS, A_FOCUS_END, t);
    float aTrueMix = mix(aTrue, aFocus, vIsFocus);
    float alpha = mix(aFalse, aTrueMix, vIsTrue);

    float chaosBirth = hash1(vEdgeIdx * 1.7 + 3.0);
    float appeared = smoothstep(chaosBirth - 0.03, chaosBirth + 0.03, uAppear);
    alpha *= appeared;

    if (alpha < 0.001) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function GnnSolution({ step }: { step: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stepRef  = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    const cleanup: Array<() => void> = [];

    (async () => {
      const res = await fetch(asset("/data/tracking_event.bin"));
      if (!res.ok || disposed) return;
      const buf = await res.arrayBuffer();
      if (disposed) return;

      let data: EventData;
      try {
        data = parseBuffer(buf);
      } catch (e) {
        console.error("tracking_event.bin parse error", e);
        return;
      }

      const w = mount.clientWidth || 1000;
      const h = mount.clientHeight || 600;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const aspect = w / h;
      const halfH = 1.08;
      const camera = new THREE.OrthographicCamera(
        -halfH * aspect, halfH * aspect,
         halfH,         -halfH,
         0.01, 10,
      );
      camera.position.set(0, 0, 2);
      camera.lookAt(0, 0, 0);

      const { nHits, nEdges, nFocusEdges, hits, edges, edgeY, trackIds,
              focusEdges, focusEdgePid } = data;

      // ── hits (points) ───────────────────────────────────────────────────
      const hitPos = new Float32Array(nHits * 3);
      const hitCol = new Float32Array(nHits * 3);
      const hitColTrack = new Float32Array(nHits * 3);
      const hitIsFocus = new Uint8Array(nHits);
      const HIT_BASE: [number, number, number] = [0.49, 0.83, 0.99];
      for (let i = 0; i < nHits; i++) {
        hitPos[i * 3]     = hits[i * 2];
        hitPos[i * 3 + 1] = hits[i * 2 + 1];
        hitPos[i * 3 + 2] = 0;
        hitCol[i * 3]     = HIT_BASE[0];
        hitCol[i * 3 + 1] = HIT_BASE[1];
        hitCol[i * 3 + 2] = HIT_BASE[2];
        const tid = trackIds[i];
        if (tid >= 0) {
          const c = focusColor(tid);
          hitColTrack[i * 3]     = c[0];
          hitColTrack[i * 3 + 1] = c[1];
          hitColTrack[i * 3 + 2] = c[2];
          hitIsFocus[i] = 1;
        } else {
          hitColTrack[i * 3]     = 0.40;
          hitColTrack[i * 3 + 1] = 0.44;
          hitColTrack[i * 3 + 2] = 0.50;
        }
      }
      const hitGeo = new THREE.BufferGeometry();
      hitGeo.setAttribute("position", new THREE.BufferAttribute(hitPos, 3));
      hitGeo.setAttribute("color",    new THREE.BufferAttribute(hitCol, 3));
      const hitMat = new THREE.PointsMaterial({
        size: 1.0,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const hitCloud = new THREE.Points(hitGeo, hitMat);
      hitCloud.renderOrder = 3;
      scene.add(hitCloud);

      // ── focus track edges (truth, pT > 1 GeV AND primary) ──────────────
      const focusPos      = new Float32Array(nFocusEdges * 6);
      const focusColAttr  = new Float32Array(nFocusEdges * 6);
      const focusPropRank = new Float32Array(nFocusEdges * 2);

      type FocusEdge = { idx: number; minR: number };
      const focusList: FocusEdge[] = new Array(nFocusEdges);

      for (let i = 0; i < nFocusEdges; i++) {
        const a = focusEdges[i * 2];
        const b = focusEdges[i * 2 + 1];
        const ax = hits[a * 2], ay = hits[a * 2 + 1];
        const bx = hits[b * 2], by = hits[b * 2 + 1];
        focusPos[i * 6]     = ax;
        focusPos[i * 6 + 1] = ay;
        focusPos[i * 6 + 2] = 0;
        focusPos[i * 6 + 3] = bx;
        focusPos[i * 6 + 4] = by;
        focusPos[i * 6 + 5] = 0;

        const c = focusColor(focusEdgePid[i]);
        focusColAttr[i * 6]     = c[0];
        focusColAttr[i * 6 + 1] = c[1];
        focusColAttr[i * 6 + 2] = c[2];
        focusColAttr[i * 6 + 3] = c[0];
        focusColAttr[i * 6 + 4] = c[1];
        focusColAttr[i * 6 + 5] = c[2];

        const ra = Math.sqrt(ax * ax + ay * ay);
        const rb = Math.sqrt(bx * bx + by * by);
        focusList[i] = { idx: i, minR: Math.min(ra, rb) };
      }
      // r-rank for inside-out reveal
      focusList.sort((x, y) => x.minR - y.minR);
      const denom = Math.max(1, focusList.length - 1);
      for (let k = 0; k < focusList.length; k++) {
        const rank = k / denom;
        const i = focusList[k].idx;
        focusPropRank[i * 2]     = rank;
        focusPropRank[i * 2 + 1] = rank;
      }

      const focusGeo = new THREE.BufferGeometry();
      focusGeo.setAttribute("position",  new THREE.BufferAttribute(focusPos, 3));
      focusGeo.setAttribute("aColor",    new THREE.BufferAttribute(focusColAttr, 3));
      focusGeo.setAttribute("aPropRank", new THREE.BufferAttribute(focusPropRank, 1));
      const focusMat = new THREE.ShaderMaterial({
        vertexShader:   FOCUS_VERT,
        fragmentShader: FOCUS_FRAG,
        uniforms: {
          uPropagation: { value: 0 },
          uHide:        { value: 0 },
        },
        transparent: true,
        depthTest: false,
      });
      const focusLines = new THREE.LineSegments(focusGeo, focusMat);
      focusLines.renderOrder = 2;
      scene.add(focusLines);

      // ── chaos: all candidate edges (step 2 sea + step 3 convergence) ───
      const edgePos    = new Float32Array(nEdges * 6);
      const aEdgeIdx   = new Float32Array(nEdges * 2);
      const aEndCol    = new Float32Array(nEdges * 6);
      const aIsTrue    = new Float32Array(nEdges * 2);
      const aIsFocus   = new Float32Array(nEdges * 2);

      for (let i = 0; i < nEdges; i++) {
        const a = edges[i * 2];
        const b = edges[i * 2 + 1];
        const ax = hits[a * 2], ay = hits[a * 2 + 1];
        const bx = hits[b * 2], by = hits[b * 2 + 1];
        edgePos[i * 6]     = ax;
        edgePos[i * 6 + 1] = ay;
        edgePos[i * 6 + 2] = 0;
        edgePos[i * 6 + 3] = bx;
        edgePos[i * 6 + 4] = by;
        edgePos[i * 6 + 5] = 0;

        const isTrue = edgeY[i] === 1;
        // A candidate edge is "focus" if both endpoints belong to a focus track.
        const ta = trackIds[a];
        const tb = trackIds[b];
        const isFocus = isTrue && ta >= 0 && ta === tb;

        let end: [number, number, number];
        if (isFocus) {
          end = focusColor(ta);
        } else if (isTrue && ta >= 0) {
          end = focusColor(ta);
        } else if (isTrue && tb >= 0) {
          end = focusColor(tb);
        } else {
          end = [0.45, 0.47, 0.52];
        }

        aEdgeIdx[i * 2]     = i;
        aEdgeIdx[i * 2 + 1] = i;
        aEndCol[i * 6]     = end[0];
        aEndCol[i * 6 + 1] = end[1];
        aEndCol[i * 6 + 2] = end[2];
        aEndCol[i * 6 + 3] = end[0];
        aEndCol[i * 6 + 4] = end[1];
        aEndCol[i * 6 + 5] = end[2];
        const tv = isTrue ? 1.0 : 0.0;
        aIsTrue[i * 2]     = tv;
        aIsTrue[i * 2 + 1] = tv;
        const fv = isFocus ? 1.0 : 0.0;
        aIsFocus[i * 2]     = fv;
        aIsFocus[i * 2 + 1] = fv;
      }

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute("position",  new THREE.BufferAttribute(edgePos, 3));
      edgeGeo.setAttribute("aEdgeIdx",  new THREE.BufferAttribute(aEdgeIdx, 1));
      edgeGeo.setAttribute("aEndCol",   new THREE.BufferAttribute(aEndCol, 3));
      edgeGeo.setAttribute("aIsTrue",   new THREE.BufferAttribute(aIsTrue, 1));
      edgeGeo.setAttribute("aIsFocus",  new THREE.BufferAttribute(aIsFocus, 1));

      const edgeMat = new THREE.ShaderMaterial({
        vertexShader:   CHAOS_VERT,
        fragmentShader: CHAOS_FRAG,
        uniforms: {
          uT:     { value: 0 },
          uBeat:  { value: 0 },
          uAppear:{ value: 0 },
        },
        transparent: true,
        depthTest: false,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.renderOrder = 1;
      scene.add(edgeLines);

      // ── animation state ─────────────────────────────────────────────────
      let uT = 0;
      let uAppear = 0;
      let uPropagation = 0;
      let uFocusHide = 0;

      const hitColAttr = hitGeo.getAttribute("color") as THREE.BufferAttribute;

      const loop = () => {
        if (disposed) return;
        const s = stepRef.current;
        const dt = 1 / 60;

        // Step 1: focus tracks reveal in r-rank order.
        if (s >= 1) {
          uPropagation = Math.min(1, uPropagation + dt / PROP_DURATION_S);
        } else {
          uPropagation = Math.max(0, uPropagation - dt / (PROP_DURATION_S * 0.5));
        }
        focusMat.uniforms.uPropagation.value = uPropagation;

        // Step 2: chaos sea fades in. Focus tracks fade out (chaos sea hides
        // them anyway, but explicit hide keeps render order clean).
        if (s >= 2) {
          uAppear = Math.min(1, uAppear + dt / STEP1_APPEAR_S);
          uFocusHide = Math.min(1, uFocusHide + dt / STEP1_APPEAR_S);
        } else {
          uAppear = Math.max(0, uAppear - dt / (STEP1_APPEAR_S * 0.5));
          uFocusHide = Math.max(0, uFocusHide - dt / (STEP1_APPEAR_S * 0.5));
        }
        edgeMat.uniforms.uAppear.value = uAppear;
        focusMat.uniforms.uHide.value = uFocusHide;

        focusLines.visible = uPropagation > 0.001 && uFocusHide < 0.999;
        edgeLines.visible  = uAppear > 0.001;

        // Step 3: message-passing convergence.
        if (s >= 3) {
          uT = Math.min(1, uT + dt / STEP2_DURATION_S);
        } else {
          uT = Math.max(0, uT - dt / (STEP2_DURATION_S * 0.5));
        }
        edgeMat.uniforms.uT.value = uT;

        const iter = uT * N_ITERATIONS;
        const phase = iter - Math.floor(iter);
        const beat = uT > 0.001 && uT < 0.999 ? Math.exp(-phase * 7.0) : 0;
        edgeMat.uniforms.uBeat.value = beat;

        // Hit recolour:
        //   - Focus hits use track colour as soon as propagation begins.
        //   - Non-focus hits stay sky-blue until message-passing converges.
        const propBlend = Math.min(1, uPropagation * 1.4);
        const messageBlend = s >= 3 ? uT : 0;
        const k = 0.10;
        for (let i = 0; i < nHits; i++) {
          const ci = i * 3;
          const isFocus = hitIsFocus[i] === 1;
          const targetBlend = isFocus
            ? Math.max(propBlend, messageBlend)
            : messageBlend;
          const dst0 = HIT_BASE[0] + (hitColTrack[ci]     - HIT_BASE[0]) * targetBlend;
          const dst1 = HIT_BASE[1] + (hitColTrack[ci + 1] - HIT_BASE[1]) * targetBlend;
          const dst2 = HIT_BASE[2] + (hitColTrack[ci + 2] - HIT_BASE[2]) * targetBlend;
          hitCol[ci]     += (dst0 - hitCol[ci])     * k;
          hitCol[ci + 1] += (dst1 - hitCol[ci + 1]) * k;
          hitCol[ci + 2] += (dst2 - hitCol[ci + 2]) * k;
        }
        hitColAttr.needsUpdate = true;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onResize = () => {
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        if (!nw || !nh) return;
        renderer.setSize(nw, nh);
        const a = nw / nh;
        camera.left  = -halfH * a;
        camera.right =  halfH * a;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup.push(() => {
        window.removeEventListener("resize", onResize);
        hitGeo.dispose(); hitMat.dispose();
        focusGeo.dispose(); focusMat.dispose();
        edgeGeo.dispose(); edgeMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      });
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 canvas-grid vignette overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex flex-col p-10 md:p-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="mt-2 font-serif italic text-zinc-100 text-[clamp(24px,2.6vw,40px)] leading-tight">
              treat the hits as a graph.
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <div
            ref={mountRef}
            className="w-full max-w-[1100px] h-full max-h-[72vh] aspect-square"
          />
        </div>

        <div className="max-w-[1400px] min-h-[140px]">
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              <p className="font-serif italic text-zinc-200 text-[clamp(22px,2.2vw,36px)] leading-tight">
                350,000 hits. one collision.
              </p>
              <p className="font-serif italic text-amber-300 text-[clamp(20px,2.0vw,32px)] leading-tight">
                Required: ~99% efficiency · &lt; 0.01% fake rate.
              </p>
            </motion.div>
          )}
          {step === 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-200 text-[clamp(22px,2.2vw,36px)] leading-tight">
              every primary particle above 1 GeV. inner detector outwards.
            </motion.p>
          )}
          {step === 2 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-200 text-[clamp(22px,2.2vw,36px)] leading-tight">
              connect every nearby pair. half a million candidate edges. every one a hypothesis.
            </motion.p>
          )}
          {step === 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif italic text-zinc-200 text-[clamp(15px,1.25vw,20px)]">
              a graph neural network passes messages across every edge. ten iterations. the network figures out which hypotheses agree.
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
