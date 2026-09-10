import { describe, expect, it } from "vitest";
import type { InterviewerBrief } from "./brief";
import { createSeededSession } from "./seed";
import {
  appliedStopReason,
  followUpBlockedReason,
  nextAskableQuestionIndex,
  reservedOpeningCount,
  skippedQuestionOutcomes,
} from "./session-policy";
import { sessionReducer } from "./reducer";
import type { SessionState } from "./session";

function brief(importance: InterviewerBrief["importance"]): InterviewerBrief {
  return {
    competency: importance,
    roleRelevance: "Role relevant.",
    importance,
    expectedDepth: "Owned example.",
    evidenceToListenFor: ["ownership"],
    followUpTriggers: ["missing ownership"],
    timeBudgetMinutes: 8,
    answerBudget: 3,
    maxFollowUps: 2,
    stopWhen: ["ownership is present"],
  };
}

function briefedState(): SessionState {
  const seeded = createSeededSession();
  const first = seeded.questions[0];
  const second = seeded.questions[1];
  const third = seeded.questions[2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error("The seed must contain three questions.");
  }
  return {
    ...seeded,
    evaluationPath: "briefed",
    sessionAnswerBudget: 2,
    questions: [
      { ...first, id: "core-a", brief: brief("core") },
      { ...second, id: "optional-b", brief: brief("optional") },
      { ...third, id: "core-c", brief: brief("core") },
    ],
  };
}

describe("session policy", () => {
  it("reserves an opening for remaining cores before allowing another follow-up", () => {
    let state = sessionReducer(briefedState(), { type: "START_SESSION" });
    state = sessionReducer(state, {
      type: "ANSWER_SUBMITTED",
      answer: "A first core answer.",
    });
    expect(reservedOpeningCount(state)).toBe(1);
    expect(followUpBlockedReason(state)).toBe(
      "protect_remaining_core_or_close",
    );
  });

  it("skips optional questions when remaining answers are needed for cores", () => {
    const started = sessionReducer(briefedState(), { type: "START_SESSION" });
    const afterAnswer = sessionReducer(started, {
      type: "ANSWER_SUBMITTED",
      answer: "A first core answer.",
    });
    expect(nextAskableQuestionIndex(afterAnswer)).toBe(2);
  });

  it("exhausts a topic answer budget before the follow-up cap", () => {
    const seeded = createSeededSession();
    const first = seeded.questions[0];
    if (first === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const state = sessionReducer(
      {
        ...seeded,
        questions: [
          {
            ...first,
            brief: { ...brief("core"), answerBudget: 1 },
          },
        ],
        evaluationPath: "briefed",
        sessionAnswerBudget: 10,
      },
      { type: "START_SESSION" },
    );
    const evaluating = sessionReducer(state, {
      type: "ANSWER_SUBMITTED",
      answer: "A first core answer.",
    });
    expect(followUpBlockedReason(evaluating)).toBe("topic_budget_exhausted");
  });

  it("does not open another question when the session answer budget is gone", () => {
    const started = sessionReducer(briefedState(), { type: "START_SESSION" });
    expect(
      nextAskableQuestionIndex({
        ...started,
        sessionAnswersUsed: started.sessionAnswerBudget,
      }),
    ).toBeUndefined();
  });

  it("records supporting skips and ignores missing question holes", () => {
    const seeded = createSeededSession();
    const first = seeded.questions[0];
    const second = seeded.questions[1];
    if (first === undefined || second === undefined) {
      throw new Error("The seed must contain questions.");
    }
    const supporting = {
      ...second,
      id: "supporting-b",
      brief: brief("supporting"),
    };
    const questions: SessionState["questions"] = [
      { ...first, id: "core-a", brief: brief("core") },
      supporting,
    ];
    delete questions[0];
    expect(
      skippedQuestionOutcomes(questions, 0, 2, 2).map(
        (outcome) => outcome.appliedStopReason,
      ),
    ).toEqual(["skipped_supporting"]);
    expect(
      skippedQuestionOutcomes([supporting], 0, 1, 0)[0]?.appliedStopReason,
    ).toBe("session_budget_exhausted");
  });

  it("skips holes in the planned question list", () => {
    const started = sessionReducer(briefedState(), { type: "START_SESSION" });
    const questions: SessionState["questions"] = [...started.questions];
    delete questions[1];
    expect(
      nextAskableQuestionIndex({
        ...started,
        questions,
        sessionAnswersUsed: 1,
      }),
    ).toBe(2);
  });

  it("honors the smaller of the question follow-up limit and the global cap", () => {
    const seeded = createSeededSession();
    const first = seeded.questions[0];
    if (first === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const started = sessionReducer(
      {
        ...seeded,
        questions: [
          {
            ...first,
            brief: { ...brief("core"), maxFollowUps: 1, answerBudget: 3 },
          },
        ],
        evaluationPath: "briefed",
        sessionAnswerBudget: 10,
      },
      { type: "START_SESSION" },
    );
    const evaluating = sessionReducer(started, {
      type: "ANSWER_SUBMITTED",
      answer: "A first core answer.",
    });
    const followed = sessionReducer(evaluating, {
      type: "ANSWER_EVALUATED",
      decision: {
        decision: "FOLLOW_UP",
        reason: "Still missing ownership evidence.",
        dimension: "specificity",
        followUp: "What did you personally change?",
        probePurpose: "ownership",
        unresolvedGap: "Ownership is still missing.",
        evidence: [
          {
            quote: "A first core answer.",
            supports: "The answer stays generic.",
          },
        ],
      },
    });
    const second = sessionReducer(followed, {
      type: "ANSWER_SUBMITTED",
      answer: "A second answer.",
    });
    expect(followUpBlockedReason(second)).toBe("follow_up_cap");
  });

  it("skips an opening optional question so remaining cores keep their slots", () => {
    const seeded = createSeededSession();
    const first = seeded.questions[0];
    const second = seeded.questions[1];
    const third = seeded.questions[2];
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error("The seed must contain three questions.");
    }
    const started = sessionReducer(
      {
        ...seeded,
        evaluationPath: "briefed",
        sessionAnswerBudget: 2,
        questions: [
          { ...first, id: "optional-a", brief: brief("optional") },
          { ...second, id: "core-b", brief: brief("core") },
          { ...third, id: "core-c", brief: brief("core") },
        ],
      },
      { type: "START_SESSION" },
    );
    expect(started.questionIndex).toBe(1);
    expect(started.questionOutcomes[0]).toMatchObject({
      questionId: "optional-a",
      appliedStopReason: "skipped_optional",
    });
  });

  it("asks supporting before optional when both could consume the spare slot", () => {
    const seeded = createSeededSession();
    const first = seeded.questions[0];
    const second = seeded.questions[1];
    const third = seeded.questions[2];
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error("The seed must contain three questions.");
    }
    const started = sessionReducer(
      {
        ...seeded,
        evaluationPath: "briefed",
        sessionAnswerBudget: 2,
        questions: [
          { ...first, id: "optional-a", brief: brief("optional") },
          { ...second, id: "supporting-b", brief: brief("supporting") },
          { ...third, id: "core-c", brief: brief("core") },
        ],
      },
      { type: "START_SESSION" },
    );
    expect(started.questionIndex).toBe(1);
    expect(started.history[0]?.questionId).toBe("supporting-b");
    expect(started.questionOutcomes[0]?.appliedStopReason).toBe(
      "skipped_optional",
    );
  });

  it("does not treat a forced advance as evidence_sufficient", () => {
    expect(
      appliedStopReason(
        {
          decision: "FOLLOW_UP",
          reason: "Still missing ownership evidence.",
          dimension: "specificity",
          followUp: "What did you personally change?",
          probePurpose: "ownership",
          unresolvedGap: "Ownership is still missing.",
          evidence: [
            {
              quote: "We shipped it",
              supports: "The answer stays collective.",
            },
          ],
        },
        "follow_up_cap",
      ),
    ).toBe("follow_up_cap");
    expect(
      appliedStopReason(
        {
          decision: "FOLLOW_UP",
          reason: "Still missing ownership evidence.",
          dimension: "specificity",
          followUp: "What did you personally change?",
          probePurpose: "ownership",
          unresolvedGap: "Ownership is still missing.",
          evidence: [
            {
              quote: "We shipped it",
              supports: "The answer stays collective.",
            },
          ],
        },
        undefined,
      ),
    ).toBe("follow_up_cap");
  });
});
