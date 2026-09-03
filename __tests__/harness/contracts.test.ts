import { describe, it, expect } from "vitest";
import {
  InterviewerDecisionSchema,
  validateTranscriptGrounding,
  FeedbackNote,
} from "@/lib/harness/schema";

describe("Layer 0: Deterministic Schema Contracts", () => {
  it("accepts a valid MOVE_ON decision", () => {
    const validMoveOn = {
      decision: "MOVE_ON",
      reason: "Candidate provided concrete architecture metrics and tradeoffs.",
    };
    const result = InterviewerDecisionSchema.safeParse(validMoveOn);
    expect(result.success).toBe(true);
  });

  it("accepts a valid FOLLOW_UP decision with required dimension and followUp string", () => {
    const validFollowUp = {
      decision: "FOLLOW_UP",
      dimension: "specificity",
      followUp: "Can you provide a specific production example where this tradeoff failed?",
      reason: "Answer was generic and lacked concrete examples.",
    };
    const result = InterviewerDecisionSchema.safeParse(validFollowUp);
    expect(result.success).toBe(true);
  });

  it("rejects FOLLOW_UP if followUp question is missing", () => {
    const invalidFollowUp = {
      decision: "FOLLOW_UP",
      dimension: "specificity",
      reason: "Answer was too generic.",
    };
    const result = InterviewerDecisionSchema.safeParse(invalidFollowUp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/strictly required/i);
    }
  });

  it("rejects FOLLOW_UP if dimension is missing", () => {
    const invalidFollowUp = {
      decision: "FOLLOW_UP",
      followUp: "Can you clarify?",
      reason: "Answer was too generic.",
    };
    const result = InterviewerDecisionSchema.safeParse(invalidFollowUp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/strictly required/i);
    }
  });

  it("rejects an invalid dimension enum (e.g., 'communication' instead of 'structure')", () => {
    const invalidDimension = {
      decision: "FOLLOW_UP",
      dimension: "communication", // Invalid: spec requires 'structure'
      followUp: "Can you be more structured?",
      reason: "Unstructured answer.",
    };
    const result = InterviewerDecisionSchema.safeParse(invalidDimension);
    expect(result.success).toBe(false);
  });
});

describe("Layer 0: Transcript Grounding Contract", () => {
  const candidateTranscript = `
    Interviewer: How do you handle cache invalidation?
    Candidate: In our high-throughput Redis tier, we chose TTL with stale-while-revalidate to avoid stampedes.
  `;

  it("passes when all feedback quotes exist verbatim in the transcript", () => {
    const notes: FeedbackNote[] = [
      {
        quote: "TTL with stale-while-revalidate to avoid stampedes",
        dimension: "fundamentals",
        feedback: "Good recognition of cache stampede mitigations.",
      },
    ];

    const result = validateTranscriptGrounding(notes, candidateTranscript);
    expect(result.valid).toBe(true);
    expect(result.ungroundedQuotes).toHaveLength(0);
  });

  it("fails when a feedback quote is fabricated or not in transcript", () => {
    const notes: FeedbackNote[] = [
      {
        quote: "we spent the first 90 seconds on unrelated work", // Hallucinated / not in transcript
        dimension: "relevance",
        feedback: "Candidate rambled off-topic.",
      },
    ];

    const result = validateTranscriptGrounding(notes, candidateTranscript);
    expect(result.valid).toBe(false);
    expect(result.ungroundedQuotes).toContain(
      "we spent the first 90 seconds on unrelated work"
    );
  });
});
