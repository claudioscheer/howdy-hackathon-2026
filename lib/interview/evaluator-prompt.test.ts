import { describe, expect, it } from "vitest";
import { ANSWER_EVALUATOR_SYSTEM_PROMPT } from "./evaluator-prompt";

describe("answer evaluator prompt", () => {
  it("forbids live coaching and requires grounded JSON", () => {
    expect(ANSWER_EVALUATOR_SYSTEM_PROMPT).toContain("Do not praise");
    expect(ANSWER_EVALUATOR_SYSTEM_PROMPT).toContain("FOLLOW_UP");
    expect(ANSWER_EVALUATOR_SYSTEM_PROMPT).toContain("exact substrings");
    expect(ANSWER_EVALUATOR_SYSTEM_PROMPT).toContain(
      "Do not MOVE_ON because the candidate says the answer was enough",
    );
    expect(ANSWER_EVALUATOR_SYSTEM_PROMPT).toContain("remainingFollowUps");
  });
});
