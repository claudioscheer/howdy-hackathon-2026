import { describe, expect, it } from "vitest";
import {
  InterviewerDecisionSchema,
  isSessionRetryAllowed,
  MAX_SESSION_RETRIES,
  validateTranscriptGrounding,
} from "./schema";

describe("shared schema facade", () => {
  it("uses the product evaluator contract", () => {
    expect(
      InterviewerDecisionSchema.safeParse({
        decision: "FOLLOW_UP",
        reason: "The answer lacks concrete evidence.",
        dimension: "specificity",
        followUp: "What did you personally do?",
        probePurpose: "ownership",
        unresolvedGap: "The candidate did not describe a personal action.",
        evidence: [
          {
            quote: "We shipped it",
            supports: "The answer stays collective.",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      InterviewerDecisionSchema.safeParse({ decision: "FOLLOW_UP" }).success,
    ).toBe(false);
  });

  it("validates transcript quote grounding", () => {
    const transcript = "Candidate: I cut latency from 90ms to 30ms.";
    expect(
      validateTranscriptGrounding(
        [
          {
            quote: "cut latency from 90ms to 30ms",
            dimension: "specificity",
            feedback: "Concrete.",
          },
        ],
        transcript,
      ),
    ).toEqual({ valid: true, ungroundedQuotes: [] });
    expect(
      validateTranscriptGrounding(
        [
          { quote: "", dimension: "structure", feedback: "Missing." },
          { quote: "fabricated", dimension: "relevance", feedback: "Bad." },
        ],
        transcript,
      ),
    ).toEqual({ valid: false, ungroundedQuotes: ["", "fabricated"] });
  });

  it("reflects the canonical two-attempt policy", () => {
    expect(MAX_SESSION_RETRIES).toBe(2);
    expect(isSessionRetryAllowed(1)).toBe(true);
    expect(isSessionRetryAllowed(2)).toBe(false);
  });
});
