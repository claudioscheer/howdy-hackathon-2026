import { describe, expect, it, vi } from "vitest";
import type { AnswerEvaluator } from "./contracts";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";
import { submitAnswer } from "./turn";

function startedState() {
  return sessionReducer(createSeededSession(), { type: "START_SESSION" });
}

describe("submitAnswer", () => {
  it("coordinates a validated evaluator decision through the reducer", async () => {
    const evaluator = new ScriptedAnswerEvaluator();
    const result = await submitAnswer(
      startedState(),
      "I generally communicate well with teammates.",
      evaluator,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision).toMatchObject({
        decision: "FOLLOW_UP",
        dimension: "specificity",
      });
      expect(result.state.followUpCount).toBe(1);
      expect(result.state.history.map((turn) => turn.kind)).toEqual([
        "question",
        "answer",
        "follow_up",
      ]);
    }
  });

  it("passes the current question and candidate transcript turn to the evaluator", async () => {
    const evaluate = vi.fn<AnswerEvaluator["evaluate"]>().mockResolvedValue({
      decision: "MOVE_ON",
      reason: "The answer contains enough concrete detail.",
    });
    const result = await submitAnswer(
      startedState(),
      "  I traced API latency and reduced it by 30%.  ",
      { evaluate },
    );

    expect(result.ok).toBe(true);
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: "I traced API latency and reduced it by 30%.",
        question: expect.objectContaining({ id: "question-collaboration" }),
        history: expect.arrayContaining([
          expect.objectContaining({
            speaker: "candidate",
            content: "I traced API latency and reduced it by 30%.",
          }),
        ]),
      }),
    );
    if (result.ok) {
      expect(result.state.questionIndex).toBe(1);
    }
  });

  it("rejects blank answers and answers submitted in the wrong state", async () => {
    const evaluator = new ScriptedAnswerEvaluator();
    const started = startedState();
    const blank = await submitAnswer(started, "   ", evaluator);
    const wrongState = await submitAnswer(
      createSeededSession(),
      "A valid answer",
      evaluator,
    );

    expect(blank).toMatchObject({ ok: false, state: started });
    expect(wrongState).toMatchObject({ ok: false });
    expect(wrongState.state).toEqual(createSeededSession());
  });

  it("rejects a state without a current question", async () => {
    const state = { ...startedState(), questionIndex: 99 };
    const result = await submitAnswer(
      state,
      "A valid candidate answer",
      new ScriptedAnswerEvaluator(),
    );

    expect(result).toEqual({
      ok: false,
      state,
      error: "The session does not have a current question.",
    });
  });

  it("preserves the original state on malformed evaluator output", async () => {
    const state = startedState();
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        return { decision: "FOLLOW_UP", reason: "Missing required fields." };
      },
    };
    const result = await submitAnswer(state, "A candidate answer", evaluator);

    expect(result).toEqual({
      ok: false,
      state,
      error: "The evaluator returned an invalid decision.",
    });
  });

  it("preserves the original state when the evaluator rejects", async () => {
    const state = startedState();
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        throw new Error("provider unavailable");
      },
    };
    const result = await submitAnswer(state, "A candidate answer", evaluator);

    expect(result).toEqual({
      ok: false,
      state,
      error: "The evaluator could not evaluate the answer.",
    });
  });
});
