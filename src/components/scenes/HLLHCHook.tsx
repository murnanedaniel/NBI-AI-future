"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

export function HLLHCHook() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number };
    const particles: P[] = [];
    const start = performance.now();

    const spawn = (density: number) => {
      const { clientWidth: w, clientHeight: h } = canvas;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 3.2;
        const max = 90 + Math.random() * 120;
        particles.push({
          x: cx + (Math.random() - 0.5) * 6,
          y: cy + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max,
          hue: 190 + Math.random() * 40,
        });
      }
    };

    const draw = () => {
      if (!running) return;
      const t = (performance.now() - start) / 1000;
      const { clientWidth: w, clientHeight: h } = canvas;

      ctx.fillStyle = "rgba(5, 6, 7, 0.22)";
      ctx.fillRect(0, 0, w, h);

      const density = Math.min(14, 1 + t * 1.8);
      spawn(Math.floor(density));

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const a = 1 - p.life / p.max;
        if (a <= 0 || p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${p.hue}, 85%, 70%, ${a * 0.85})`;
        ctx.lineWidth = 1.1;
        ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      ctx.beginPath();
      const pulse = 1 + 0.15 * Math.sin(t * 3);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 40 * pulse);
      grad.addColorStop(0, "rgba(125, 211, 252, 0.9)");
      grad.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = grad;
      ctx.arc(w / 2, h / 2, 40 * pulse, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 canvas-grid vignette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.2, delay: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <motion.div
        className="absolute inset-0 flex flex-col justify-between p-10 md:p-16 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 1.0, delay: 0.9 } }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">Act 1 · The box</div>
            <div className="mt-2 text-[clamp(28px,4vw,56px)] font-serif italic text-zinc-100 leading-none">
              the problem we haven&rsquo;t solved
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 text-right">
            <div>ATLAS · HL-LHC</div>
            <div>⟨μ⟩ ≈ 200 collisions / crossing</div>
          </div>
        </div>

        <div className="max-w-xl text-zinc-300 text-[clamp(15px,1.25vw,20px)] leading-relaxed">
          <p className="font-serif italic text-zinc-400 mb-3">placeholder narration</p>
          <p>
            Every 25 ns, roughly 200 proton–proton collisions pile on top of each other.
            Tracks from one event live inside the debris of 199 others.
          </p>
          <p className="mt-3 text-zinc-400">
            For a decade we&rsquo;ve been building ML to pull them apart. This talk is about
            what happened when the model started helping us <em>build the ML</em>.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
