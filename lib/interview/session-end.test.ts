import { describe, expect, it } from "vitest";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";
import { endSessionEarly } from "./session-end";
import type { SessionState } from "./session";

function startedState(): SessionState {
  return sessionReducer(createSeededSession(), { type: "START_SESSION" });
}

describe("endSessionEarly", () => {
  it("marks only questions without an outcome as candidate-ended-early", () => {
    const started = startedState();
    const mid: SessionState = {
      ...started,
      questionIndex: 1,
      questionOutcomes: [
        {
          questionId: "question-collaboration",
          recommendedDecision: "MOVE_ON",
          recommendedStopReason: "evidence_sufficient",
          appliedStopReason: "evidence_sufficient",
        },
      ],
      usedQuestions: [
        {
          id: "question-collaboration",
          prompt: started.questions[0]?.prompt ?? "prompt",
        },
      ],
      history: [
        ...started.history,
        {
          id: "turn-answer",
          questionId: "question-collaboration",
          speaker: "candidate",
          kind: "answer",
          content: "I owned the rollback and cut errors by 20%.",
        },
        {
          id: "turn-next",
          questionId: "question-api-design",
          speaker: "interviewer",
          kind: "question",
          content: started.questions[1]?.prompt ?? "next",
        },
      ],
    };
    const ended = endSessionEarly(mid);

    expect(ended.status).toBe("GENERATING_REPORT");
    expect(ended.questionOutcomes.map((outcome) => outcome.questionId)).toEqual(
      ["question-collaboration", "question-api-design", "question-delivery"],
    );
    expect(ended.questionOutcomes.slice(1)).toEqual([
      {
        questionId: "question-api-design",
        appliedStopReason: "candidate_ended_early",
      },
      {
        questionId: "question-delivery",
        appliedStopReason: "candidate_ended_early",
      },
    ]);
    expect(ended.usedQuestions.map((question) => question.id)).toEqual([
      "question-collaboration",
      "question-api-design",
    ]);
  });

  it("ignores end events that arrive without a current asked question", () => {
    const planned = createSeededSession();
    expect(endSessionEarly(planned)).toBe(planned);
    const awaitingUnknown: SessionState = {
      ...planned,
      status: "AWAITING_ANSWER",
      questionIndex: 99,
    };
    expect(endSessionEarly(awaitingUnknown).usedQuestions).toEqual([]);
    expect(endSessionEarly(awaitingUnknown).questionOutcomes).toEqual([]);
  });

  it("does not record a current question that was never asked", () => {
    const started = startedState();
    const unasked: SessionState = {
      ...started,
      history: [],
    };
    expect(endSessionEarly(unasked).usedQuestions).toEqual([]);
  });

  it("does not duplicate a question already on the used list", () => {
    const started = startedState();
    const alreadyUsed: SessionState = {
      ...started,
      usedQuestions: [
        {
          id: "question-collaboration",
          prompt: started.questions[0]?.prompt ?? "prompt",
        },
      ],
    };
    expect(endSessionEarly(alreadyUsed).usedQuestions).toHaveLength(1);
  });
});
