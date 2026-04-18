"use client";

import { motion } from "motion/react";
import { EasterShell } from "./EasterShell";

export function EasterArchitecture() {
  return (
    <EasterShell
      beat={6}
      headline="Let the tracks talk to each other."
      hint={<>§3.2 · cross-track attention</>}
      align="center"
    >
      <div className="max-w-[1200px] w-full">
        <motion.svg
          viewBox="0 0 900 340"
          className="w-full h-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7 } }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
            </marker>
          </defs>

          <g fontFamily="var(--font-geist-mono)" fontSize="11" fill="#d4d4d8">
            {[0, 1, 2, 3, 4].map((i) => {
              const x = 60 + i * 60;
              return (
                <motion.g
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 + i * 0.08 } }}
                >
                  <rect x={x} y={30} width="44" height="30" rx="3" fill="#0ea5e910" stroke="#7dd3fc66" />
                  <text x={x + 22} y={49} textAnchor="middle" fill="#7dd3fc">track {i + 1}</text>
                </motion.g>
              );
            })}
            <text x={400} y={48} fill="#52525b">…</text>
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.8 } }}
            >
              <rect x={430} y={30} width="44" height="30" rx="3" fill="#0ea5e910" stroke="#7dd3fc66" />
              <text x={452} y={49} textAnchor="middle" fill="#7dd3fc">track T</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 1.1 } }}
            >
              <rect x={60} y={100} width="414" height="44" rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x={267} y={128} textAnchor="middle" fill="#e4e4e7">per-track transformer encoder</text>
              <text x={267} y={142} textAnchor="middle" fill="#71717a" fontSize="9">5.0 M params · 8 layers · d_model = 256 · [CLS] per track</text>
            </motion.g>

            {[0, 1, 2, 3, 4].map((i) => {
              const x = 60 + i * 60;
              return <line key={"l1-" + i} x1={x + 22} y1={60} x2={x + 22} y2={100} stroke="#71717a" markerEnd="url(#arrow)" />;
            })}
            <line x1={452} y1={60} x2={452} y2={100} stroke="#71717a" markerEnd="url(#arrow)" />

            {[0, 1, 2, 3, 4].map((i) => {
              const x = 60 + i * 60;
              return (
                <motion.g
                  key={"h" + i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 1.6 + i * 0.06 } }}
                >
                  <circle cx={x + 22} cy={176} r="8" fill="#7dd3fc20" stroke="#7dd3fc" />
                  <text x={x + 22} y={180} textAnchor="middle" fontSize="9" fill="#7dd3fc">h{i + 1}</text>
                </motion.g>
              );
            })}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 2.0 } }}
            >
              <circle cx={452} cy={176} r="8" fill="#7dd3fc20" stroke="#7dd3fc" />
              <text x={452} y={180} textAnchor="middle" fontSize="9" fill="#7dd3fc">hT</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, delay: 2.3 } }}
              style={{ transformOrigin: "555px 176px" }}
            >
              <circle cx={555} cy={176} r="14" fill="#fbbf2420" stroke="#f59e0b" strokeWidth="1.5" />
              <text x={555} y={180} textAnchor="middle" fontSize="10" fill="#fbbf24" fontWeight="bold">[EVT]</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 2.7 } }}
            >
              <rect x={610} y={130} width="240" height="96" rx="5" fill="#7c3aed10" stroke="#a78bfa" />
              <text x={730} y={158} textAnchor="middle" fill="#c4b5fd" fontSize="12">cross-track attention</text>
              <text x={730} y={176} textAnchor="middle" fill="#71717a" fontSize="9">2 layers · 8 heads · d_ff = 1024</text>
              <text x={730} y={194} textAnchor="middle" fill="#71717a" fontSize="9">attends across 1 + T tokens</text>
              <text x={730} y={212} textAnchor="middle" fill="#71717a" fontSize="9">+3.2 M params on top</text>
            </motion.g>

            {[0, 1, 2, 3, 4].map((i) => {
              const x = 60 + i * 60;
              return <motion.line key={"toattn" + i} x1={x + 22 + 8} y1={176} x2={610} y2={178} stroke="#a78bfa40" strokeWidth="0.8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, transition: { duration: 0.7, delay: 3.0 + i * 0.05 } }}
              />;
            })}
            <motion.line x1={452 + 8} y1={176} x2={610} y2={178} stroke="#a78bfa40" strokeWidth="0.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, transition: { duration: 0.7, delay: 3.3 } }}
            />
            <motion.line x1={555 + 14} y1={176} x2={610} y2={178} stroke="#fbbf24aa" strokeWidth="1.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, transition: { duration: 0.7, delay: 3.5 } }}
            />

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 3.9 } }}
            >
              <rect x={610} y={260} width="240" height="40" rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x={730} y={276} textAnchor="middle" fontSize="11" fill="#d4d4d8">per-track MLP head</text>
              <text x={730} y={290} textAnchor="middle" fontSize="9" fill="#71717a">d₀, z₀, sinφ, cosφ, cotθ, q/p</text>
              <line x1={730} y1={226} x2={730} y2={260} stroke="#71717a" markerEnd="url(#arrow)" />
            </motion.g>
          </g>
        </motion.svg>

        <motion.div
          className="text-center mt-8 font-serif italic text-zinc-300 text-[clamp(18px,1.6vw,26px)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 4.3 } }}
        >
          The <span className="text-amber-300">[EVT]</span> token attends across all tracks. One learnable slot for &ldquo;what does this whole event say?&rdquo;
        </motion.div>
      </div>
    </EasterShell>
  );
}
