import { describe, it, expect } from "vitest";
import {
  blankAnswerDecision,
  type InterviewerDecision,
  InterviewerDecisionSchema,
  isBlankAnswer,
  isSessionRetryAllowed,
  MAX_FOLLOW_UPS_PER_QUESTION,
  MAX_SESSION_RETRIES,
  type QuestionState,
  resolveDecisionWithPolicy,
  validateTranscriptGrounding,
  type FeedbackNote,
} from "@/lib/harness/schema";

describe("decision schema", () => {
  it("accepts a valid MOVE_ON decision", () => {
    const result = InterviewerDecisionSchema.safeParse({
      decision: "MOVE_ON",
      reason: "Candidate provided concrete architecture metrics and tradeoffs.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts FOLLOW_UP when dimension and followUp are present", () => {
    const result = InterviewerDecisionSchema.safeParse({
      decision: "FOLLOW_UP",
      dimension: "specificity",
      followUp:
        "Can you provide a specific production example where this tradeoff failed?",
      reason: "Answer was generic and lacked concrete examples.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects FOLLOW_UP without a followUp question", () => {
    const result = InterviewerDecisionSchema.safeParse({
      decision: "FOLLOW_UP",
      dimension: "specificity",
      reason: "Answer was too generic.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects FOLLOW_UP without a dimension", () => {
    const result = InterviewerDecisionSchema.safeParse({
      decision: "FOLLOW_UP",
      followUp: "Can you clarify?",
      reason: "Answer was too generic.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a dimension that is not in the rubric", () => {
    const result = InterviewerDecisionSchema.safeParse({
      decision: "FOLLOW_UP",
      dimension: "communication",
      followUp: "Can you be more structured?",
      reason: "Unstructured answer.",
    });
    expect(result.success).toBe(false);
  });
});

describe("transcript grounding", () => {
  const transcript = `
    Interviewer: How do you handle cache invalidation?
    Candidate: In our high-throughput Redis tier, we chose TTL with stale-while-revalidate to avoid stampedes.
  `;

  it("passes when every quote is a substring of the transcript", () => {
    const notes: FeedbackNote[] = [
      {
        quote: "TTL with stale-while-revalidate to avoid stampedes",
        dimension: "fundamentals",
        feedback: "Good recognition of cache stampede mitigations.",
      },
    ];
    const result = validateTranscriptGrounding(notes, transcript);
    expect(result.valid).toBe(true);
    expect(result.ungroundedQuotes).toHaveLength(0);
  });

  it("fails when a quote is empty", () => {
    const notes: FeedbackNote[] = [
      {
        quote: "",
        dimension: "structure",
        feedback: "Missing citation.",
      },
    ];
    const result = validateTranscriptGrounding(notes, "some transcript");
    expect(result.valid).toBe(false);
    expect(result.ungroundedQuotes).toEqual([""]);
  });

  it("fails when a quote is not in the transcript", () => {
    const notes: FeedbackNote[] = [
      {
        quote: "we spent the first 90 seconds on unrelated work",
        dimension: "relevance",
        feedback: "Candidate rambled off-topic.",
      },
    ];
    const result = validateTranscriptGrounding(notes, transcript);
    expect(result.valid).toBe(false);
    expect(result.ungroundedQuotes).toContain(
      "we spent the first 90 seconds on unrelated work",
    );
  });
});

describe("session retries", () => {
  it("allows three attempts and no more", () => {
    expect(MAX_SESSION_RETRIES).toBe(3);
    expect(isSessionRetryAllowed(0)).toBe(true);
    expect(isSessionRetryAllowed(2)).toBe(true);
    expect(isSessionRetryAllowed(3)).toBe(false);
  });
});

describe("blank answers", () => {
  it("treats empty and whitespace as blank", () => {
    expect(isBlankAnswer("")).toBe(true);
    expect(isBlankAnswer("  \n")).toBe(true);
    expect(isBlankAnswer("done")).toBe(false);
  });

  it("fails closed to a specificity follow-up", () => {
    const decision = blankAnswerDecision();
    expect(decision.decision).toBe("FOLLOW_UP");
    expect(decision.dimension).toBe("specificity");
    expect(decision.followUp?.length).toBeGreaterThan(0);
  });
});

describe("follow-up cap", () => {
  const followUpDecision: InterviewerDecision = {
    decision: "FOLLOW_UP",
    dimension: "specificity",
    followUp: "Can you be more concrete?",
    reason: "Candidate was vague.",
  };

  it("allows FOLLOW_UP under the cap", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 0,
      isComplete: false,
    };
    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("FOLLOW_UP");
    expect(result.isCapped).toBe(false);
  });

  it("allows FOLLOW_UP on the second turn", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 1,
      isComplete: false,
    };
    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("FOLLOW_UP");
    expect(result.isCapped).toBe(false);
  });

  it("forces MOVE_ON when the cap is reached", () => {
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: MAX_FOLLOW_UPS_PER_QUESTION,
      isComplete: false,
    };
    const result = resolveDecisionWithPolicy(followUpDecision, state);
    expect(result.finalDecision).toBe("MOVE_ON");
    expect(result.isCapped).toBe(true);
  });

  it("keeps MOVE_ON when the answer was already good", () => {
    const moveOn: InterviewerDecision = {
      decision: "MOVE_ON",
      reason: "Excellent concrete explanation.",
    };
    const state: QuestionState = {
      questionId: "q1",
      followUpCount: 0,
      isComplete: false,
    };
    const result = resolveDecisionWithPolicy(moveOn, state);
    expect(result.finalDecision).toBe("MOVE_ON");
    expect(result.isCapped).toBe(false);
  });
});
