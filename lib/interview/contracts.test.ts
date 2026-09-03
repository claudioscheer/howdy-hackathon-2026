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
    expect(
      QuestionPlanSchema.safeParse({ questions: [question] }).success,
    ).toBe(true);
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
      }).success,
    ).toBe(false);
  });

  it("requires every report dimension and grounded evidence shapes", () => {
    const dimension = {
      score: 4,
      summary: "Strong evidence.",
      evidence: [{ questionId: "q-1", quote: "reduced P99 latency" }],
    };
    expect(
      SessionReportSchema.safeParse({
        attemptNumber: 1,
        summary: "A strong attempt.",
        dimensions: {
          relevance: dimension,
          specificity: dimension,
          fundamentals: dimension,
          structure: dimension,
        },
      }).success,
    ).toBe(true);
  });
});
