import { afterEach, describe, expect, it, vi } from "vitest";
import {
  QUESTION_POLL_INTERVAL_MS,
  QUESTION_PREP_DELAY_MS,
  waitForQuestionPrep,
} from "./question-prep-wait";

describe("question prep wait", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits the placeholder delay", async () => {
    vi.useFakeTimers();
    const pending = waitForQuestionPrep();
    await vi.advanceTimersByTimeAsync(QUESTION_PREP_DELAY_MS);
    await pending;
    expect(QUESTION_PREP_DELAY_MS).toBe(1500);
    expect(QUESTION_POLL_INTERVAL_MS).toBe(3000);
  });
});
