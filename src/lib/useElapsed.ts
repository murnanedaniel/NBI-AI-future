"use client";

import { useEffect, useRef, useState } from "react";

export function useElapsed(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const accRef = useRef(0);

  useEffect(() => {
    if (!running) {
      if (startRef.current != null) {
        accRef.current += performance.now() - startRef.current;
        startRef.current = null;
      }
      return;
    }
    startRef.current = performance.now();
    let raf = 0;
    let alive = true;
    let lastSec = -1;
    const tick = () => {
      if (!alive) return;
      const now = performance.now();
      const run = startRef.current != null ? now - startRef.current : 0;
      const sec = Math.floor((accRef.current + run) / 1000);
      // only trigger a React re-render when the displayed second changes
      if (sec !== lastSec) {
        lastSec = sec;
        setElapsed((accRef.current + run) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [running]);

  const reset = () => {
    accRef.current = 0;
    startRef.current = running ? performance.now() : null;
    setElapsed(0);
  };

  return { elapsed, reset };
}
