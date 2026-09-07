import { describe, expect, it } from "vitest";
import { EvalScenarioSchema, type EvalScenario } from "./fixtures";
import {
  answerSimilarityFailure,
  behaviorCoverageFailures,
  duplicateIdFailures,
  independenceFailures,
  reviewEvalSuite,
} from "./review-suite";

function scenario(id: string, answers: string[]): EvalScenario {
  return EvalScenarioSchema.parse({
    id,
    description: `Scenario ${id}`,
    steps: answers.map((answer) => ({
      answer,
      expected: {
        outcome: "APPLIED",
        recommendedDecision: "MOVE_ON",
        questionIndex: 1,
        followUpCount: 0,
        historyLength: 3,
        status: "AWAITING_ANSWER",
      },
    })),
  });
}

describe("scenario review", () => {
  it("flags duplicate ids", () => {
    const item = scenario("duplicate", ["alpha beta gamma"]);
    expect(duplicateIdFailures([[item], [item]])).toHaveLength(1);
    expect(duplicateIdFailures([[item], []])).toEqual([]);
  });

  it("detects containment and token similarity in either direction", () => {
    const short = scenario("short", ["alpha beta gamma delta"]);
    const long = scenario("long", ["alpha beta gamma delta epsilon"]);
    expect(answerSimilarityFailure(short, long, 0.9)).toMatch(/contains/);
    expect(answerSimilarityFailure(long, short, 0.9)).toMatch(/contains/);
    const close = scenario("close", ["alpha beta gamma zeta"]);
    expect(answerSimilarityFailure(short, close, 0.2)).toMatch(/similar/);
    expect(answerSimilarityFailure(short, close, 0.99)).toBeNull();
    expect(independenceFailures([short], [close], "Holdout", 0.2)).toHaveLength(
      1,
    );
  });

  it("requires every business-critical golden behavior", () => {
    expect(behaviorCoverageFailures([])[0]).toMatch(/FOLLOW_UP/);
    const covered = EvalScenarioSchema.parse({
      id: "covered",
      description: "Covers all expected behaviors.",
      evaluator: "MALFORMED",
      steps: [
        {
          answer: "first weak answer",
          expected: {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            questionIndex: 0,
            followUpCount: 2,
            historyLength: 3,
            status: "AWAITING_ANSWER",
          },
        },
        {
          answer: "second weak answer",
          expected: {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            questionIndex: 1,
            followUpCount: 0,
            historyLength: 5,
            status: "AWAITING_ANSWER",
          },
        },
        {
          answer: "strong answer",
          expected: {
            outcome: "APPLIED",
            recommendedDecision: "MOVE_ON",
            questionIndex: 1,
            followUpCount: 0,
            historyLength: 7,
            status: "AWAITING_ANSWER",
          },
        },
      ],
    });
    expect(behaviorCoverageFailures([covered])).toEqual([]);
    expect(reviewEvalSuite({ goldens: [covered], holdouts: [] })).toEqual([]);
  });
});
