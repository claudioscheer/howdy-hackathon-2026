import { describe, expect, it, vi } from "vitest";
import {
  OpenCodeAnswerEvaluator,
  createOpenCodeAnswerEvaluator,
} from "./evaluator-opencode";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { questionPlanSessionId } from "./planner";

vi.mock("./opencode-client", () => ({
  createOpenCodeClientFromEnv: () => ({
    complete: async () =>
      JSON.stringify({
        decision: "MOVE_ON",
        reason: "The answer includes enough concrete evidence to continue.",
        recommendedStopReason: "evidence_sufficient",
        evidence: [
          {
            quote: "I reduced latency by 30 percent",
            supports: "The candidate named a personal result.",
          },
        ],
      }),
  }),
}));

describe("OpenCodeAnswerEvaluator", () => {
  it("asks the model for a structured interviewer decision", async () => {
    const complete = vi.fn(async () =>
      JSON.stringify({
        decision: "MOVE_ON",
        reason: "The answer includes enough concrete evidence to continue.",
        recommendedStopReason: "evidence_sufficient",
        evidence: [
          {
            quote: "I reversed write-through caching",
            supports: "I reversed write-through caching",
          },
        ],
      }),
    );
    const evaluator = new OpenCodeAnswerEvaluator({ complete });
    await expect(
      evaluator.evaluate({
        opportunity: {
          id: "opp-1",
          role: "fullstack",
          seniority: "senior",
          targetTechStack: ["TypeScript"],
          interviewType: "behavioral",
        },
        question: {
          id: "q-1",
          prompt: "Describe an incident.",
          primaryDimension: "specificity",
        },
        answer: "I reduced latency by 30 percent",
        history: [],
      }),
    ).resolves.toMatchObject({
      decision: "MOVE_ON",
      evidence: [{ quote: "I reduced latency by 30 percent" }],
    });
    const liveCall = complete.mock.calls[0]?.[0];
    expect(liveCall?.sessionId).toBe(questionPlanSessionId("opp-1", 1));
    expect(liveCall?.maxTokens).toBe(DEFAULT_MAX_COMPLETION_TOKENS);
    expect(liveCall?.json).toBe(true);
    expect(String(liveCall?.messages[1]?.content)).toContain("latestAnswer");
    await evaluator.evaluate({ answer: "malformed" });
    expect(complete.mock.calls[1]?.[0]?.sessionId).toBe(
      "question-plan:answer-eval",
    );
    expect(createOpenCodeAnswerEvaluator()).toBeInstanceOf(
      OpenCodeAnswerEvaluator,
    );
  });
});
