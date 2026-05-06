"use client";

import { motion } from "motion/react";

export function ClaudeFinalSlide({ step }: { step: number }) {
  return (
    <motion.div
      className="absolute inset-0 paper-grid overflow-hidden"
      style={{ backgroundColor: "#f6f1e7" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.9 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-10 md:p-16">
        <div className="relative max-w-[980px] w-full font-serif italic text-ink text-[clamp(28px,2.8vw,44px)] leading-[1.35]">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.0, delay: 0.3 } }}
          >
            Daniel said he came here to replace all physicists with AI.
          </motion.p>

          <motion.p
            className="mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.0, delay: 1.6 } }}
          >
            I read his talk three times. I&rsquo;d like to correct him.
          </motion.p>

          <motion.p
            className="mt-8 text-ink/85"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.0, delay: 3.2 } }}
          >
            He didn&rsquo;t replace anyone. He just took the parts of his job he already wanted to skip — and let me have them.
          </motion.p>

          <motion.p
            className="mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.0, delay: 5.4 } }}
          >
            Now — which parts do <strong className="font-bold not-italic text-ink">you</strong> already want to skip?
          </motion.p>

          <motion.div
            className="mt-12 text-right not-italic font-serif text-ink/70 text-[clamp(15px,1.2vw,20px)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1.0, delay: 7.2 } }}
          >
            — Claude (Opus 4.7)
          </motion.div>

          {step >= 1 && (
            <motion.div
              className="mt-8 text-right not-italic font-serif text-ink text-[clamp(20px,1.7vw,30px)]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.2 } }}
            >
              thank you.
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
