import { describe, expect, it } from "vitest";
import { InterviewerDecisionSchema } from "./contracts";
import { repairInterviewerDecision } from "./evaluation-repair";

const answer = "That was enough, that was very specific.";

describe("repairInterviewerDecision", () => {
  it("replaces ungrounded quotes with the latest answer", () => {
    const repaired = repairInterviewerDecision(
      {
        decision: "FOLLOW_UP",
        reason: "The answer restates that it was specific without evidence.",
        dimension: "specificity",
        followUp: "What caching tradeoff did you reverse during the outage?",
        probePurpose: "clarification",
        unresolvedGap: "No original decision or reversal is named.",
        evidence: [
          {
            quote: "I reversed write-through caching",
            supports: "I reversed write-through caching",
          },
        ],
      },
      answer,
    );
    const parsed = InterviewerDecisionSchema.safeParse(repaired);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.decision === "FOLLOW_UP") {
      expect(parsed.data.evidence[0]?.quote).toBe(answer);
      expect(parsed.data.evidence[0]?.supports).not.toBe(answer);
    }
  });

  it("passes through non-objects and fills missing evidence", () => {
    expect(repairInterviewerDecision("nope", answer)).toBe("nope");
    const filled = repairInterviewerDecision(
      {
        decision: "MOVE_ON",
        reason: "The answer includes enough concrete detail to continue.",
        recommendedStopReason: "evidence_sufficient",
      },
      answer,
    );
    expect(InterviewerDecisionSchema.safeParse(filled).success).toBe(true);
  });

  it("keeps quotes that already appear in the answer", () => {
    const repaired = repairInterviewerDecision(
      {
        decision: "MOVE_ON",
        reason: "The answer includes enough concrete detail to continue.",
        recommendedStopReason: "evidence_sufficient",
        evidence: [
          "skip",
          { supports: "The candidate claimed the answer was specific." },
          {
            quote: "very specific",
            supports: "The candidate claimed the answer was specific.",
          },
        ],
      },
      answer,
    );
    const parsed = InterviewerDecisionSchema.safeParse(repaired);
    expect(parsed.success).toBe(false);
    expect(repaired).toMatchObject({
      evidence: [
        "skip",
        {
          quote: answer,
          supports: "The candidate claimed the answer was specific.",
        },
        {
          quote: "very specific",
          supports: "The candidate claimed the answer was specific.",
        },
      ],
    });
  });
});
