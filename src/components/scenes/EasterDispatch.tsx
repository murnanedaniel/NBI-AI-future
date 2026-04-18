"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { EasterShell } from "./EasterShell";

const PROMPT_LINES = [
  "> the ML track models are memorizing the training beamspot.",
  "> see if you can fix this.",
  "> budget: whatever it takes. I need to get back to my kid.",
];

const JOBS = [
  "[SUBMITTED]  simulate_randomized_beamspot_300um  (32 nodes × 8h)",
  "[SUBMITTED]  simulate_shifted_25um               (16 nodes × 4h)",
  "[SUBMITTED]  simulate_shifted_300um              (16 nodes × 4h)",
  "[SUBMITTED]  train_per_track_transformer_randomized  (8 × A100 × 6h)",
  "[SUBMITTED]  train_cross_track_attention_warm_start  (8 × A100 × 4h)",
  "[SUBMITTED]  eval_grid_3x4_matrix                (16 × A100 × 2h)",
  "[SUBMITTED]  probe_EVT_token_primary_vertex       (1 × A100 × 15m)",
];

export function EasterDispatch() {
  const cpuRef = useRef<HTMLSpanElement>(null);
  const gpuRef = useRef<HTMLSpanElement>(null);
  const wallRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const ramp = Math.min(1, t / 6);
      const cpu = Math.floor(ramp * 42800);
      const gpu = Math.floor(ramp * 684);
      const wall = (ramp * 23.7).toFixed(1);
      if (cpuRef.current) cpuRef.current.textContent = cpu.toLocaleString();
      if (gpuRef.current) gpuRef.current.textContent = gpu.toLocaleString();
      if (wallRef.current) wallRef.current.textContent = wall;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <EasterShell
      beat={5}
      headline="Two minutes of typing. Then Perlmutter woke up."
      hint={<>placeholder · real sacct TK</>}
      align="top"
    >
      <div className="grid md:grid-cols-[1fr_1fr] gap-8 max-w-[1200px] w-full">
        <motion.div
          className="bg-zinc-900/70 border border-white/10 rounded-md p-5 font-mono text-[13px] leading-relaxed text-zinc-300 shadow-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        >
          <div className="text-zinc-500 text-[11px] mb-2">terminal · 2026-04-05 07:14 CET</div>
          {PROMPT_LINES.map((line, i) => (
            <motion.div
              key={i}
              className="text-sky-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.3 + i * 0.5 } }}
            >
              {line}
            </motion.div>
          ))}
          <motion.div
            className="text-zinc-500 pt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4, delay: 2.1 } }}
          >
            $ claude dispatch &amp;
          </motion.div>
        </motion.div>

        <motion.div
          className="bg-zinc-950/80 border border-white/10 rounded-md p-5 font-mono text-[11.5px] leading-relaxed text-zinc-400"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 1.6 } }}
        >
          <div className="text-emerald-400/80 text-[10px] uppercase tracking-wider mb-2">Perlmutter · SLURM queue</div>
          {JOBS.map((j, i) => (
            <motion.div
              key={j}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.4, delay: 2.0 + i * 0.25 } }}
              className="text-zinc-300"
            >
              <span className="text-emerald-400">✓</span> {j}
            </motion.div>
          ))}

          <motion.div
            className="mt-5 pt-3 border-t border-white/10 grid grid-cols-3 gap-3 text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: 4.0 } }}
          >
            <div>
              <div className="text-zinc-500">CPU-h</div>
              <div className="text-zinc-100 text-[18px] tabular-nums"><span ref={cpuRef}>0</span></div>
            </div>
            <div>
              <div className="text-zinc-500">GPU-h</div>
              <div className="text-zinc-100 text-[18px] tabular-nums"><span ref={gpuRef}>0</span></div>
            </div>
            <div>
              <div className="text-zinc-500">wall [h]</div>
              <div className="text-zinc-100 text-[18px] tabular-nums"><span ref={wallRef}>0.0</span></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </EasterShell>
  );
}
