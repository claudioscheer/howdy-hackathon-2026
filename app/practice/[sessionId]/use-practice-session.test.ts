import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import type { SessionState } from "@/lib/interview/session";
import { createSeededSession } from "@/lib/interview/seed";
import { PRACTICE_PAGE } from "@/lib/ui/copy";
import type { PracticeActionResult } from "./actions";
import { usePracticeSession } from "./use-practice-session";

const submitPracticeAnswerAction = vi.hoisted(() => vi.fn());
const endPracticeAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({
  submitPracticeAnswerAction,
  endPracticeAction,
}));

type Deferred = {
  promise: Promise<PracticeActionResult>;
  resolve: (result: PracticeActionResult) => void;
};

function deferred(): Deferred {
  let resolve: (result: PracticeActionResult) => void = () => undefined;
  const promise = new Promise<PracticeActionResult>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function answeredState(): SessionState {
  const started = sessionReducer(createSeededSession(), {
    type: "START_SESSION",
  });
  return { ...started, questionIndex: 1, followUpCount: 0 };
}

function startedWithAnswer(): RenderHookResult<
  ReturnType<typeof usePracticeSession>,
  unknown
> {
  const hook = renderHook(() => usePracticeSession(createSeededSession()));
  act(() => {
    hook.result.current.startInterview();
  });
  act(() => {
    hook.result.current.setAnswer("A concrete answer with a result.");
  });
  return hook;
}

describe("usePracticeSession", () => {
  afterEach(() => {
    submitPracticeAnswerAction.mockReset();
    endPracticeAction.mockReset();
  });

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
    expect(submitPracticeAnswerAction).not.toHaveBeenCalled();
  });

  it("ignores a second submit fired in the same tick as the first", async () => {
    const pending = deferred();
    submitPracticeAnswerAction.mockReturnValue(pending.promise);
    const { result } = startedWithAnswer();
    const submit = result.current.submitCurrentAnswer;
    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = submit();
      second = submit();
    });
    expect(submitPracticeAnswerAction).toHaveBeenCalledOnce();
    expect(result.current.isSubmitting).toBe(true);
    await act(async () => {
      pending.resolve({ ok: true, state: answeredState() });
      await Promise.all([first, second]);
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.session.questionIndex).toBe(1);
    expect(result.current.answer).toBe("");
  });

  it("ignores End while an answer is in flight", async () => {
    const pending = deferred();
    submitPracticeAnswerAction.mockReturnValue(pending.promise);
    const { result } = startedWithAnswer();
    let submitting: Promise<void> = Promise.resolve();
    act(() => {
      submitting = result.current.submitCurrentAnswer();
      result.current.setConfirmEnd(true);
    });
    await act(async () => {
      await result.current.confirmEndInterview();
    });
    expect(endPracticeAction).not.toHaveBeenCalled();
    expect(result.current.confirmEnd).toBe(false);
    await act(async () => {
      pending.resolve({ ok: true, state: answeredState() });
      await submitting;
    });
    expect(result.current.session.status).toBe("AWAITING_ANSWER");
    expect(result.current.session.questionIndex).toBe(1);
  });

  it("ignores a submit while End is in flight", async () => {
    const pending = deferred();
    endPracticeAction.mockReturnValue(pending.promise);
    const { result } = startedWithAnswer();
    let ending: Promise<void> = Promise.resolve();
    act(() => {
      ending = result.current.confirmEndInterview();
    });
    await act(async () => {
      await result.current.submitCurrentAnswer();
    });
    expect(submitPracticeAnswerAction).not.toHaveBeenCalled();
    await act(async () => {
      pending.resolve({ ok: false, error: "Could not end." });
      await ending;
    });
    expect(result.current.error).toBe("Could not end.");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("releases the lock after a failed submit so the candidate can retry", async () => {
    submitPracticeAnswerAction
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true, state: answeredState() });
    const { result } = startedWithAnswer();
    await act(async () => {
      await result.current.submitCurrentAnswer();
    });
    expect(result.current.error).toBe(PRACTICE_PAGE.evaluateFailed);
    expect(result.current.answer).toBe("A concrete answer with a result.");
    await act(async () => {
      await result.current.submitCurrentAnswer();
    });
    expect(submitPracticeAnswerAction).toHaveBeenCalledTimes(2);
    expect(result.current.session.questionIndex).toBe(1);
  });
});
