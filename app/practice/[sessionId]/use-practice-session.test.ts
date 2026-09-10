import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createSeededSession } from "@/lib/interview/seed";
import { PRACTICE_PAGE } from "@/lib/ui/copy";
import { usePracticeSession } from "./use-practice-session";

describe("usePracticeSession", () => {
  it("starts the interview and rejects a blank answer", async () => {
    const { result } = renderHook(() =>
      usePracticeSession(createSeededSession()),
    );
    act(() => {
      result.current.startInterview();
    });
    expect(result.current.session.status).toBe("AWAITING_ANSWER");
    await act(async () => {
      await result.current.submitCurrentAnswer();
    });
    expect(result.current.error).toBe(PRACTICE_PAGE.emptyAnswer);
  });
});
