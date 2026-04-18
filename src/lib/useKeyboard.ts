"use client";

import { useEffect } from "react";

type Handlers = {
  onAdvance?: () => void;
  onRewind?: () => void;
  onToggleClock?: () => void;
  onToggleFallback?: () => void;
  onRestart?: () => void;
};

const ADVANCE_KEYS = new Set([" ", "ArrowRight", "PageDown", "Enter"]);
const REWIND_KEYS = new Set(["ArrowLeft", "PageUp", "Backspace"]);

export function useKeyboard(h: Handlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ADVANCE_KEYS.has(e.key)) {
        e.preventDefault();
        h.onAdvance?.();
        return;
      }
      if (REWIND_KEYS.has(e.key)) {
        e.preventDefault();
        h.onRewind?.();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        h.onToggleClock?.();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        h.onToggleFallback?.();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        h.onRestart?.();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h]);
}
