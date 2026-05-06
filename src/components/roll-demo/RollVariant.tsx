"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { VariantConfig } from "./variants";

function makeCheckerTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 160;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f6f1e3";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#c7bd9e";
  const cols = 16;
  const rows = 10;
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

type SceneRefs = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  material: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry;
  texture?: THREE.Texture;
  bgGeo: THREE.BufferGeometry;
  bgMat: THREE.Material;
};

export function RollVariant({
  config,
  progress,
  width,
  height,
}: {
  config: VariantConfig;
  progress: number;
  width: number;
  height: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<SceneRefs | null>(null);

  // Build / rebuild scene when config, width, or height change.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x050607, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(config.fov, width / height, 0.01, 50);
    camera.position.set(...config.cameraPos);
    camera.lookAt(...config.cameraLookAt);

    const slideAspect = 16 / 10;
    const planeH = 1.0;
    const planeW = planeH * slideAspect * 0.88;
    const geometry = new THREE.PlaneGeometry(
      planeW,
      planeH,
      config.subdivisions[0],
      config.subdivisions[1],
    );

    const uniforms: Record<string, THREE.IUniform> = {
      u_progress: { value: progress },
    };

    let texture: THREE.Texture | undefined;
    if (config.texture === "checker") {
      texture = makeCheckerTexture();
      uniforms.u_map = { value: texture };
    }
    if (config.endFade > 0) {
      uniforms.u_endFadeAmt = { value: config.endFade };
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: config.vertSrc,
      fragmentShader: config.fragSrc,
      uniforms,
      side: THREE.DoubleSide,
      transparent: config.endFade > 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const bgGeo = new THREE.PlaneGeometry(20, 20);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x050607 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.z = -0.5;
    scene.add(bg);

    renderer.render(scene, camera);

    refs.current = { renderer, scene, camera, material, geometry, texture, bgGeo, bgMat };

    return () => {
      refs.current = null;
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [config, width, height]);

  // Update progress uniform + re-render on every prop change. Deterministic — no RAF.
  useEffect(() => {
    const r = refs.current;
    if (!r) return;
    r.material.uniforms.u_progress.value = progress;
    r.renderer.render(r.scene, r.camera);
  }, [progress]);

  return <div ref={mountRef} style={{ width, height }} />;
}
