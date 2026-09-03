import { describe, expect, it } from "vitest";
import { type EvalFixture } from "./fixtures";
import { runSensitivityChecks } from "./sensitivity";

const opportunity = {
  id: "fictional-role",
  role: "Engineer",
  seniority: "Senior",
  targetTechStack: ["TypeScript"],
  interviewType: "technical" as const,
};

function fixture(
  id: string,
  answer: string,
  decision: "FOLLOW_UP" | "MOVE_ON",
): EvalFixture {
  return {
    id,
    description: id,
    input: {
      opportunity,
      question: {
        id: "q1",
        prompt: "Describe a recent incident.",
        primaryDimension: "specificity",
      },
      answer,
      history: [],
    },
    expected: { decision },
  };
}

describe("behavioral sensitivity", () => {
  it("rejects trivial always-advance and always-follow-up mutations", async () => {
    const result = await runSensitivityChecks([
      fixture("weak", "I always communicate well.", "FOLLOW_UP"),
      fixture("strong", "I cut P99 from 900ms to 60ms.", "MOVE_ON"),
    ]);
    expect(result).toEqual({
      alwaysMoveOnRejected: true,
      alwaysFollowUpRejected: true,
    });
  });

  it("shows when an incomplete suite cannot reject a mutation", async () => {
    const result = await runSensitivityChecks([
      fixture("strong", "I cut P99 from 900ms to 60ms.", "MOVE_ON"),
    ]);
    expect(result.alwaysMoveOnRejected).toBe(false);
    expect(result.alwaysFollowUpRejected).toBe(true);
  });
});
