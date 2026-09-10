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
      "I had a disagreement with a teammate but we figured it out.",
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
      recommendedStopReason: "evidence_sufficient",
      evidence: [
        {
          quote: "I traced API latency and reduced it by 30%.",
          supports: "The answer includes a personal investigation and result.",
        },
      ],
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
        clock: expect.objectContaining({ elapsedSeconds: 0 }),
        push: expect.objectContaining({
          remainingFollowUps: 2,
          followUpCap: 2,
        }),
      }),
    );
    if (result.ok) {
      expect(result.state.questionIndex).toBe(1);
    }

    evaluate.mockClear();
    await submitAnswer(
      startedState(),
      "I traced API latency and reduced it by 30%.",
      { evaluate },
      { elapsedSeconds: 75, submittedAt: "2026-09-10T12:01:15.000Z" },
    );
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        clock: {
          submittedAt: "2026-09-10T12:01:15.000Z",
          elapsedSeconds: 75,
        },
      }),
    );
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

  it("rejects interviewer wording quoted as candidate evidence", async () => {
    const state = startedState();
    const question = state.history[0]?.content;
    if (question === undefined) {
      throw new Error("The session must open with an interviewer question.");
    }
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        return {
          decision: "MOVE_ON",
          reason: "The evaluator claimed enough evidence.",
          recommendedStopReason: "evidence_sufficient",
          evidence: [
            {
              quote: question,
              supports: "The quoted text is the interviewer question.",
            },
          ],
        };
      },
    };
    const result = await submitAnswer(state, "I do not know", evaluator);
    expect(result).toEqual({
      ok: false,
      state,
      error: "The evaluator returned an invalid decision.",
    });
  });

  it("preserves the original state when evidence is not in the transcript", async () => {
    const state = startedState();
    const evaluator: AnswerEvaluator = {
      async evaluate() {
        return {
          decision: "MOVE_ON",
          reason: "The answer contains enough concrete detail.",
          recommendedStopReason: "evidence_sufficient",
          evidence: [
            {
              quote: "fabricated ownership claim",
              supports: "This quote is not in the transcript.",
            },
          ],
        };
      },
    };
    const result = await submitAnswer(state, "A candidate answer", evaluator);

    expect(result).toEqual({
      ok: false,
      state,
      error: "The evaluator returned an invalid decision.",
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
