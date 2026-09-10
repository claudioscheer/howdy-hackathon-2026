"use client";

import { useEffect, useRef, useState } from "react";

export function useElapsedSeconds(active: boolean): number {
  const startedAt = useRef<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    if (startedAt.current === undefined) {
      startedAt.current = Date.now();
    }
    const origin = startedAt.current;
    function tick(): void {
      setElapsed(Math.floor((Date.now() - origin) / 1000));
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  return elapsed;
}
