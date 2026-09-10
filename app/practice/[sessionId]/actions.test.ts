import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import { createSeededSession } from "@/lib/interview/seed";

const progressInterview = vi.hoisted(() => vi.fn());
const endInterview = vi.hoisted(() => vi.fn());
const savePracticeAttempt = vi.hoisted(() => vi.fn());

vi.mock("@/lib/interview/session-report", () => ({
  progressInterview,
  endInterview,
}));

vi.mock("@/lib/db/practice-attempts", () => ({
  savePracticeAttempt,
}));

import { endPracticeAction, submitPracticeAnswerAction } from "./actions";

describe("practice server actions", () => {
  beforeEach(() => {
    progressInterview.mockReset();
    endInterview.mockReset();
    savePracticeAttempt.mockReset();
    savePracticeAttempt.mockResolvedValue(undefined);
  });

  it("rejects a payload that is not a session", async () => {
    await expect(submitPracticeAnswerAction({}, "An answer")).resolves.toEqual({
      ok: false,
      error: "The session could not be read.",
    });
    await expect(endPracticeAction({ sessionId: 1 })).resolves.toEqual({
      ok: false,
      error: "The session could not be read.",
    });
  });

  it("forwards a valid session to the interview runtime", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    progressInterview.mockResolvedValue({ ok: true, state: started });
    endInterview.mockResolvedValue({ ok: true, state: started });

    await expect(
      submitPracticeAnswerAction(started, "A concrete answer"),
    ).resolves.toEqual({ ok: true, state: started });
    expect(progressInterview).toHaveBeenCalledOnce();
    await expect(endPracticeAction(started)).resolves.toEqual({
      ok: true,
      state: started,
    });
    expect(endInterview).toHaveBeenCalledOnce();
    expect(savePracticeAttempt).not.toHaveBeenCalled();
  });

  it("does not persist a rejected turn", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    progressInterview.mockResolvedValue({
      ok: false,
      state: started,
      error: "nope",
    });
    await submitPracticeAnswerAction(started, "An answer", 4);
    expect(savePracticeAttempt).not.toHaveBeenCalled();
  });

  it("persists a completed scorecard and ignores persist failures", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const complete = { ...started, status: "COMPLETE" as const };
    progressInterview.mockResolvedValue({ ok: true, state: complete });
    await submitPracticeAnswerAction(started, "A concrete answer", 30);
    expect(savePracticeAttempt).toHaveBeenCalledWith(complete, 30);
    savePracticeAttempt.mockRejectedValueOnce(new Error("db down"));
    endInterview.mockResolvedValue({ ok: true, state: complete });
    await expect(endPracticeAction(started, 12)).resolves.toEqual({
      ok: true,
      state: complete,
    });
  });
});
