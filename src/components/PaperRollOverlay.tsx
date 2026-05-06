"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Persistent paper-roll overlay that lives above all scenes.
// Driven by a target `progress` prop; smoothly tweens its internal u_progress
// toward the target so it can roll in, hold, and fade on cue from Stage.

const VERT = /* glsl */ `
  uniform float u_progress;
  varying vec2  v_uv;
  varying vec3  v_worldPos;
  varying float v_angle;

  void main() {
    float halfH = 0.5;
    float baseR = 0.28;
    float TWO_PI = 6.28318530718;

    float R = baseR * mix(1.0, 0.40, smoothstep(0.55, 1.0, u_progress));

    float startY = -halfH;
    float endY   =  halfH + TWO_PI * baseR;
    float frontY = mix(startY, endY, u_progress);

    float shift = -max(0.0, frontY);

    vec3 pos = position;
    float dy = frontY - pos.y;

    v_angle = 0.0;
    if (dy > 0.0) {
      float angle = dy / R;
      v_angle = angle;
      pos.z -= R * (1.0 - cos(angle));
      pos.y  = frontY - R * sin(angle);
    }
    pos.y += shift;

    v_uv = uv;
    v_worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float u_progress;
  varying vec2 v_uv;
  varying vec3 v_worldPos;
  varying float v_angle;

  void main() {
    vec3 base = vec3(0.965, 0.945, 0.906);

    vec3 N = normalize(cross(dFdx(v_worldPos), dFdy(v_worldPos)));
    if (N.z < 0.0) N = -N;
    vec3 L = normalize(vec3(0.0, 0.0, 1.0));
    float lambert = max(0.22, dot(N, L));
    float inside = smoothstep(3.14159265, 6.28318530, v_angle) * 0.35;

    vec3 col = base * lambert * (1.0 - inside);
    // Fade only over the last 7% of progress — keeps the settled tube at
    // u_progress≈0.98 visible (~25% alpha) while still hitting 0 at 1.0.
    float alpha = 1.0 - smoothstep(0.93, 1.0, u_progress);
    gl_FragColor = vec4(col, alpha);
  }
`;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

type Props = {
  /** Where the roll wants to be. 0 = flat plane, ~0.98 = settled faint tube, 1 = fully faded. */
  target: number;
  /** Milliseconds for the tween to reach the target. */
  durationMs?: number;
  /** Hide the canvas entirely when true (e.g. on the title scene before any rolling). */
  hidden?: boolean;
};

// Camera / plane constants.
// The plane's local geometry is 1.6 × 1.0 world units (16:10 aspect, matching
// the CSS title-slide paper: w-[78%] max-w-[1100px] aspect-[16/10]).
// We then scale the mesh each frame-of-resize so its on-screen footprint
// matches the CSS paper exactly — identical size + centered position, so the
// hand-off from CSS paper → 3D paper roll is visually seamless.
const CAM_FOV_DEG = 40;
const CAM_Z = 2.4;
const CAM_FOV_RAD = (CAM_FOV_DEG * Math.PI) / 180;
const VISIBLE_HALF_H = CAM_Z * Math.tan(CAM_FOV_RAD / 2); // world half-height at z=0
const PAPER_VW_FRAC = 0.78;     // w-[78%]
const PAPER_MAX_PX = 1100;      // max-w-[1100px]
const PAPER_ASPECT = 16 / 10;

function computePaperScale(vw: number, vh: number) {
  const paperPxW = Math.min(PAPER_VW_FRAC * vw, PAPER_MAX_PX);
  const aspect = vw / vh;
  const visibleWorldW = VISIBLE_HALF_H * 2 * aspect;
  const desiredWorldW = (paperPxW / vw) * visibleWorldW;
  return desiredWorldW / PAPER_ASPECT; // geometry is 1.6 wide → scale gives world width
}

export function PaperRollOverlay({ target, durationMs = 1800, hidden = false }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const tweenFromRef = useRef(0);
  const tweenToRef = useRef(0);
  const tweenStartRef = useRef(0);
  const tweenDurRef = useRef(durationMs);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // One-time Three.js setup.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // fully transparent background — scenes show through
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAM_FOV_DEG, w / h, 0.01, 50);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    // Geometry is 1.6 × 1.0 (16:10); mesh.scale sizes it to match the CSS paper.
    const geo = new THREE.PlaneGeometry(PAPER_ASPECT, 1.0, 6, 200);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { u_progress: { value: 0.0 } },
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const initialScale = computePaperScale(w, h);
    mesh.scale.setScalar(initialScale);
    scene.add(mesh);

    matRef.current = mat;
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Persistent RAF loop: always running, tweens toward tweenToRef.
    let raf = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const now = performance.now();
      const from = tweenFromRef.current;
      const to = tweenToRef.current;
      const dur = tweenDurRef.current;
      const t = Math.min(1, (now - tweenStartRef.current) / Math.max(1, dur));
      const eased = easeInOut(t);
      progressRef.current = from + (to - from) * eased;
      mat.uniforms.u_progress.value = progressRef.current;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      mesh.scale.setScalar(computePaperScale(nw, nh));
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Start a new tween whenever the target changes.
  useEffect(() => {
    tweenFromRef.current = progressRef.current;
    tweenToRef.current = target;
    tweenStartRef.current = performance.now();
    tweenDurRef.current = durationMs;
  }, [target, durationMs]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-30"
      style={{ display: hidden ? "none" : "block" }}
    />
  );
}
