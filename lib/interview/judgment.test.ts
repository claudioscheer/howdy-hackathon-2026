import { describe, expect, it } from "vitest";
import {
  InterviewerDecisionSchema,
  judgmentEvidenceIsGrounded,
} from "./judgment";

const quote = "I used React for six months on a personal project";
const followUp = {
  decision: "FOLLOW_UP" as const,
  reason: "The answer does not address the asked question.",
  dimension: "relevance" as const,
  followUp: "How does that relate to a disagreement with a teammate?",
  probePurpose: "relevance" as const,
  unresolvedGap: "The candidate has not answered the asked question.",
  evidence: [
    {
      quote,
      supports:
        "The quoted answer is a personal React project, not a conflict.",
    },
  ],
};

describe("evaluator judgment contract", () => {
  it("requires transcript-grounded evidence and a probe purpose on follow-ups", () => {
    expect(InterviewerDecisionSchema.safeParse(followUp).success).toBe(true);
    expect(
      InterviewerDecisionSchema.safeParse({
        decision: "FOLLOW_UP",
        reason: "The answer lacks evidence.",
        dimension: "specificity",
        followUp: "What did you change?",
      }).success,
    ).toBe(false);
  });

  it("requires contradiction follow-ups to cite both statements", () => {
    expect(
      InterviewerDecisionSchema.safeParse({
        ...followUp,
        probePurpose: "contradiction",
      }).success,
    ).toBe(false);
    expect(
      InterviewerDecisionSchema.safeParse({
        ...followUp,
        probePurpose: "contradiction",
        evidence: [
          {
            quote: "We added caching",
            supports: "The first turn claims caching fixed latency.",
          },
          {
            quote: "We never changed the data path",
            supports: "The later turn denies a data-path change.",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("keeps model stop recommendations off of policy reasons", () => {
    expect(
      InterviewerDecisionSchema.safeParse({
        decision: "MOVE_ON",
        reason: "The candidate already covered the required evidence.",
        recommendedStopReason: "evidence_sufficient",
        evidence: [
          {
            quote: "I owned the rollback",
            supports: "The candidate claimed personal ownership.",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      InterviewerDecisionSchema.safeParse({
        decision: "MOVE_ON",
        reason: "Time ran out on the topic.",
        recommendedStopReason: "follow_up_cap",
        evidence: [
          {
            quote: "I owned the rollback",
            supports: "The candidate claimed personal ownership.",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects quotes that are missing from the transcript or restated as the claim", () => {
    expect(judgmentEvidenceIsGrounded(followUp.evidence, quote)).toBe(true);
    expect(
      judgmentEvidenceIsGrounded(followUp.evidence, "An unrelated transcript."),
    ).toBe(false);
    expect(
      judgmentEvidenceIsGrounded([{ quote, supports: quote }], quote),
    ).toBe(false);
  });
});
