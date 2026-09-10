import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useElapsedSeconds } from "./practice-elapsed";

describe("useElapsedSeconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays at zero until the interview is active", () => {
    const { result } = renderHook(() => useElapsedSeconds(false));
    expect(result.current).toBe(0);
  });

  it("counts elapsed seconds once the interview starts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const { result, rerender } = renderHook(
      ({ active }) => useElapsedSeconds(active),
      { initialProps: { active: false } },
    );
    rerender({ active: true });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(2);
    rerender({ active: false });
    rerender({ active: true });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBeGreaterThanOrEqual(2);
  });
});
