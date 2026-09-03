import { describe, it, expect } from "vitest";
import {
  InterviewerDecision,
  MAX_FOLLOW_UPS_PER_QUESTION,
  QuestionState,
  resolveDecisionWithPolicy,
} from "@/lib/harness/schema";

describe("Layer 0: State Machine & Policy Boundaries", () => {
  const followUpDecision: InterviewerDecision = {
    decision: "FOLLOW_UP",
    dimension: "specificity",
    followUp: "Can you be more concrete?",
    reason: "Candidate was vague.",
  };

  it("permits FOLLOW_UP when under the follow-up cap", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 0,
      isComplete: false,
    };

    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("FOLLOW_UP");
    expect(result.isCapped).toBe(false);
  });

  it("permits FOLLOW_UP on second turn (followUpCount = 1)", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 1,
      isComplete: false,
    };

    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("FOLLOW_UP");
    expect(result.isCapped).toBe(false);
  });

  it("forces MOVE_ON when followUpCount reaches MAX_FOLLOW_UPS_PER_QUESTION", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: MAX_FOLLOW_UPS_PER_QUESTION,
      isComplete: false,
    };

    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("MOVE_ON");
    expect(result.isCapped).toBe(true);
    expect(result.reason).toMatch(/policy cap reached/i);
  });

  it("preserves MOVE_ON when candidate already answered well", () => {
    const moveOnDecision: InterviewerDecision = {
      decision: "MOVE_ON",
      reason: "Excellent concrete explanation.",
    };
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 0,
      isComplete: false,
    };

    const result = resolveDecisionWithPolicy(moveOnDecision, state);
    expect(result.finalDecision).toBe("MOVE_ON");
    expect(result.isCapped).toBe(false);
  });
});
