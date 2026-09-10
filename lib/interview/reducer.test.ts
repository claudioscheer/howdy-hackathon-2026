import { describe, expect, it } from "vitest";
import type { InterviewerDecision, SessionReport } from "./contracts";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";
import type { SessionState } from "./session";

const followUp: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason: "The answer needs a specific example.",
  dimension: "specificity",
  followUp: "What did you personally do, and what changed?",
  probePurpose: "clarification",
  unresolvedGap: "The answer lacks a personal action and result.",
  evidence: [
    {
      quote: "A candidate answer",
      supports: "The answer stays generic instead of citing work.",
    },
  ],
};

const moveOn: InterviewerDecision = {
  decision: "MOVE_ON",
  reason: "The answer is sufficiently specific.",
  recommendedStopReason: "evidence_sufficient",
  evidence: [
    {
      quote: "A candidate answer",
      supports: "The answer is specific enough to leave the topic.",
    },
  ],
};

function startedState(): SessionState {
  return sessionReducer(createSeededSession(), { type: "START_SESSION" });
}

function evaluatingState(state: SessionState, answer = "A candidate answer") {
  return sessionReducer(state, { type: "ANSWER_SUBMITTED", answer });
}

describe("sessionReducer", () => {
  it("starts on the first question with a deterministic interviewer turn", () => {
    const planned = createSeededSession();
    const started = sessionReducer(planned, { type: "START_SESSION" });

    expect(started.status).toBe("AWAITING_ANSWER");
    expect(started.questionIndex).toBe(0);
    expect(started.history).toEqual([
      {
        id: `${planned.sessionId}-turn-1`,
        questionId: "question-collaboration",
        speaker: "interviewer",
        kind: "question",
        content: planned.questions[0]?.prompt,
      },
    ]);
  });

  it("appends a candidate answer before evaluation", () => {
    const started = startedState();
    const evaluating = evaluatingState(started, "I kept everyone aligned.");

    expect(evaluating.status).toBe("EVALUATING_ANSWER");
    expect(evaluating.history.at(-1)).toMatchObject({
      id: `${started.sessionId}-turn-2`,
      questionId: "question-collaboration",
      speaker: "candidate",
      kind: "answer",
      content: "I kept everyone aligned.",
    });
  });

  it("adds up to two follow-ups while retaining the full transcript", () => {
    const firstEvaluation = evaluatingState(startedState());
    const firstFollowUp = sessionReducer(firstEvaluation, {
      type: "ANSWER_EVALUATED",
      decision: followUp,
    });
    const secondEvaluation = evaluatingState(firstFollowUp);
    const secondFollowUp = sessionReducer(secondEvaluation, {
      type: "ANSWER_EVALUATED",
      decision: followUp,
    });

    expect(firstFollowUp.followUpCount).toBe(1);
    expect(secondFollowUp.followUpCount).toBe(2);
    expect(secondFollowUp.status).toBe("AWAITING_ANSWER");
    expect(secondFollowUp.history.map((turn) => turn.kind)).toEqual([
      "question",
      "answer",
      "follow_up",
      "answer",
      "follow_up",
    ]);
  });

  it("moves to the next question after a concrete answer", () => {
    const followedUp = sessionReducer(evaluatingState(startedState()), {
      type: "ANSWER_EVALUATED",
      decision: followUp,
    });
    const advanced = sessionReducer(evaluatingState(followedUp), {
      type: "ANSWER_EVALUATED",
      decision: moveOn,
    });

    expect(advanced.status).toBe("AWAITING_ANSWER");
    expect(advanced.questionIndex).toBe(1);
    expect(advanced.followUpCount).toBe(0);
    expect(advanced.completedQuestionIds).toEqual(["question-collaboration"]);
    expect(advanced.usedQuestions).toEqual([
      {
        id: "question-collaboration",
        prompt: followedUp.questions[0]?.prompt,
      },
    ]);
    expect(advanced.history.at(-1)).toMatchObject({
      questionId: "question-api-design",
      speaker: "interviewer",
      kind: "question",
    });
  });

  it("forces advancement when the evaluator recommends a third follow-up", () => {
    let state = startedState();
    for (let count = 0; count < 3; count += 1) {
      state = sessionReducer(evaluatingState(state), {
        type: "ANSWER_EVALUATED",
        decision: followUp,
      });
    }

    expect(state.questionIndex).toBe(1);
    expect(state.followUpCount).toBe(0);
    expect(
      state.history.filter((turn) => turn.kind === "follow_up"),
    ).toHaveLength(2);
    expect(state.questionOutcomes[0]).toMatchObject({
      recommendedDecision: "FOLLOW_UP",
      appliedStopReason: "follow_up_cap",
    });
  });

  it("completes after the final question and does not duplicate usage", () => {
    const seeded = createSeededSession();
    const finalQuestion = seeded.questions[2];
    if (finalQuestion === undefined) {
      throw new Error("The seed must have a final question.");
    }
    const awaitingFinal: SessionState = {
      ...seeded,
      status: "AWAITING_ANSWER",
      questionIndex: 2,
      completedQuestionIds: [finalQuestion.id],
      usedQuestions: [{ id: finalQuestion.id, prompt: finalQuestion.prompt }],
    };
    const complete = sessionReducer(evaluatingState(awaitingFinal), {
      type: "ANSWER_EVALUATED",
      decision: moveOn,
    });

    expect(complete.status).toBe("COMPLETE");
    expect(complete.questionIndex).toBe(2);
    expect(complete.completedQuestionIds).toEqual([finalQuestion.id]);
    expect(complete.usedQuestions).toHaveLength(1);
  });

  it("ignores events that are invalid for the current transition", () => {
    const planned = createSeededSession();
    const missingQuestion = { ...planned, questionIndex: 99 };
    const started = startedState();
    const evaluating = evaluatingState(started);

    expect(sessionReducer(started, { type: "START_SESSION" })).toBe(started);
    expect(
      sessionReducer(missingQuestion, { type: "START_SESSION" }).status,
    ).toBe("AWAITING_ANSWER");
    expect(
      sessionReducer(planned, { type: "ANSWER_SUBMITTED", answer: "No" }),
    ).toBe(planned);
    expect(
      sessionReducer(
        { ...missingQuestion, status: "AWAITING_ANSWER" },
        { type: "ANSWER_SUBMITTED", answer: "No" },
      ),
    ).toMatchObject({ questionIndex: 99, history: [] });
    expect(
      sessionReducer(started, {
        type: "ANSWER_EVALUATED",
        decision: moveOn,
      }),
    ).toBe(started);
    expect(
      sessionReducer(
        { ...evaluating, questionIndex: 99 },
        { type: "ANSWER_EVALUATED", decision: moveOn },
      ),
    ).toMatchObject({ questionIndex: 99, status: "EVALUATING_ANSWER" });
  });

  it("only accepts a report from the report-generation state", () => {
    const state = startedState();
    const dimension = {
      status: "scored" as const,
      score: 4,
      summary: "Grounded.",
      evidence: [],
    };
    const report: SessionReport = {
      attemptNumber: 1,
      summary: "A grounded attempt.",
      dimensions: {
        relevance: dimension,
        specificity: dimension,
        fundamentals: dimension,
        structure: dimension,
      },
    };
    const event = { type: "REPORT_GENERATED", report } as const;

    expect(sessionReducer(state, event)).toBe(state);
    expect(
      sessionReducer({ ...state, status: "GENERATING_REPORT" }, event),
    ).toMatchObject({ status: "COMPLETE", report });
  });
});
