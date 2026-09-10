import { describe, expect, it } from "vitest";
import {
  AnswerEvaluationInputSchema,
  InterviewerDecisionSchema,
  QuestionPlanSchema,
  ReportEvaluationInputSchema,
  SessionReportSchema,
} from "./contracts";

const opportunity = {
  id: "fictional-platform-role",
  role: "Senior Platform Engineer",
  seniority: "Senior",
  targetTechStack: ["TypeScript", "PostgreSQL"],
  interviewType: "technical",
} as const;

const question = {
  id: "q-1",
  prompt: "Describe a production incident you owned.",
  primaryDimension: "specificity",
} as const;

describe("runtime model-boundary contracts", () => {
  it("requires complete structured follow-up decisions", () => {
    expect(
      InterviewerDecisionSchema.safeParse({
        decision: "FOLLOW_UP",
        reason: "The answer lacks evidence.",
        dimension: "specificity",
        followUp: "What did you personally change?",
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
      InterviewerDecisionSchema.safeParse({
        decision: "FOLLOW_UP",
        reason: "The answer lacks evidence.",
      }).success,
    ).toBe(false);
  });

  it("validates planner and evaluator inputs", () => {
    const planned = QuestionPlanSchema.safeParse({ questions: [question] });
    expect(planned.success).toBe(true);
    if (planned.success) {
      expect(planned.data.targetMinutes).toBe(40);
      expect(planned.data.sessionAnswerBudget).toBe(10);
    }
    expect(
      AnswerEvaluationInputSchema.safeParse({
        opportunity,
        question,
        answer: "I reduced P99 latency after tracing a pool leak.",
        history: [],
      }).success,
    ).toBe(true);
    expect(
      ReportEvaluationInputSchema.safeParse({
        opportunity,
        attemptNumber: 1,
        transcript: [],
        questions: [question],
        questionOutcomes: [],
      }).success,
    ).toBe(false);
    expect(
      ReportEvaluationInputSchema.safeParse({
        opportunity,
        attemptNumber: 1,
        transcript: [
          {
            id: "t1",
            questionId: "q-1",
            speaker: "candidate",
            kind: "answer",
            content: "I reduced P99 latency after tracing a pool leak.",
          },
        ],
        questions: [question],
        questionOutcomes: [
          {
            questionId: "q-1",
            recommendedDecision: "MOVE_ON",
            recommendedStopReason: "evidence_sufficient",
            appliedStopReason: "evidence_sufficient",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires every report dimension and grounded evidence shapes", () => {
    const dimension = {
      status: "scored",
      score: 4,
      summary: "Strong evidence.",
      evidence: [{ questionId: "q-1", quote: "reduced P99 latency" }],
    };
    const unknown = {
      status: "insufficient_evidence",
      summary: "The topic ended before fundamentals were tested.",
      evidence: [{ questionId: "q-1", quote: "reduced P99 latency" }],
      remainingUnknown: "No fundamentals probe was asked.",
    };
    expect(
      SessionReportSchema.safeParse({
        attemptNumber: 1,
        summary: "A strong attempt.",
        dimensions: {
          relevance: dimension,
          specificity: dimension,
          fundamentals: unknown,
          structure: dimension,
        },
      }).success,
    ).toBe(true);
    expect(
      SessionReportSchema.safeParse({
        attemptNumber: 1,
        summary: "A strong attempt.",
        dimensions: {
          relevance: { score: 4, summary: "Old shape.", evidence: [] },
          specificity: dimension,
          fundamentals: dimension,
          structure: dimension,
        },
      }).success,
    ).toBe(false);
  });
});
