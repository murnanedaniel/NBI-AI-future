"use client";

import { useEffect, useRef } from "react";

type Handlers = {
  onAdvance?: () => void;
  onRewind?: () => void;
  onToggleClock?: () => void;
  onToggleFallback?: () => void;
  onRestart?: () => void;
};

const ADVANCE_KEYS = new Set([" ", "ArrowRight", "ArrowDown", "PageDown", "Enter", "BrowserForward", "MediaTrackNext"]);
const REWIND_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "BrowserBack", "MediaTrackPrevious"]);

export function useKeyboard(h: Handlers) {
  const ref = useRef(h);
  ref.current = h;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { onAdvance, onRewind, onToggleClock, onToggleFallback, onRestart } = ref.current;
      if (ADVANCE_KEYS.has(e.key)) {
        e.preventDefault();
        onAdvance?.();
        return;
      }
      if (REWIND_KEYS.has(e.key)) {
        e.preventDefault();
        onRewind?.();
        return;
      }
      if (e.key === "p" || e.key === "P") { onToggleClock?.(); return; }
      if (e.key === "f" || e.key === "F") { onToggleFallback?.(); return; }
      if (e.key === "r" || e.key === "R") { onRestart?.(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // stable — never re-registers
}
