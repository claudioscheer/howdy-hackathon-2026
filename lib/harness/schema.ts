import { z } from "zod";

/**
 * Layer 0: Deterministic Contracts
 * Core data contracts for interview decisions, evaluation rubrics,
 * state machine constraints, and transcript grounding.
 */

export const RubricDimensionSchema = z.enum([
  "relevance",
  "specificity",
  "fundamentals",
  "structure",
]);
export type RubricDimension = z.infer<typeof RubricDimensionSchema>;

export const DecisionTypeSchema = z.enum(["FOLLOW_UP", "MOVE_ON"]);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

export const InterviewerDecisionSchema = z
  .object({
    decision: DecisionTypeSchema,
    reason: z.string().min(5, "Reason must provide meaningful justification"),
    dimension: RubricDimensionSchema.optional(),
    followUp: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.decision === "FOLLOW_UP") {
        return (
          typeof data.followUp === "string" &&
          data.followUp.trim().length > 0 &&
          data.dimension !== undefined
        );
      }
      return true;
    },
    {
      message:
        "When decision is FOLLOW_UP, followUp question and dimension are strictly required",
      path: ["followUp"],
    },
  );

export type InterviewerDecision = z.infer<typeof InterviewerDecisionSchema>;

export const HistoryTurnSchema = z.object({
  role: z.enum(["interviewer", "candidate"]),
  content: z.string(),
});

export const EvaluationInputSchema = z.object({
  role: z.string().min(1),
  seniority: z.string().min(1),
  targetTechStack: z.array(z.string()),
  question: z.string().min(1),
  answer: z.string(),
  history: z.array(HistoryTurnSchema).optional(),
});
export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;

export const QuestionStateSchema = z.object({
  questionId: z.string().min(1),
  followUpCount: z.number().int().nonnegative(),
  isComplete: z.boolean(),
});
export type QuestionState = z.infer<typeof QuestionStateSchema>;

export interface FeedbackNote {
  quote: string;
  dimension: RubricDimension;
  feedback: string;
}

export function validateTranscriptGrounding(
  notes: FeedbackNote[],
  transcript: string,
): { valid: boolean; ungroundedQuotes: string[] } {
  const ungroundedQuotes: string[] = [];

  for (const note of notes) {
    if (!note.quote || !transcript.includes(note.quote)) {
      ungroundedQuotes.push(note.quote);
    }
  }

  return {
    valid: ungroundedQuotes.length === 0,
    ungroundedQuotes,
  };
}

export const MAX_FOLLOW_UPS_PER_QUESTION = 2;
export const MAX_SESSION_RETRIES = 3;

export function isSessionRetryAllowed(attemptNumber: number): boolean {
  return attemptNumber < MAX_SESSION_RETRIES;
}

export function isBlankAnswer(answer: string): boolean {
  return answer.trim().length === 0;
}

export function blankAnswerDecision(): InterviewerDecision {
  return {
    decision: "FOLLOW_UP",
    dimension: "specificity",
    reason:
      "The candidate submitted an empty answer with no evidence to evaluate.",
    followUp:
      "Take a moment and walk me through a specific example from your recent work.",
  };
}

export function resolveDecisionWithPolicy(
  rawDecision: InterviewerDecision,
  currentState: QuestionState,
): {
  finalDecision: DecisionType;
  isCapped: boolean;
  followUp?: string;
  dimension?: RubricDimension;
  reason: string;
} {
  if (
    rawDecision.decision === "FOLLOW_UP" &&
    currentState.followUpCount >= MAX_FOLLOW_UPS_PER_QUESTION
  ) {
    return {
      finalDecision: "MOVE_ON",
      isCapped: true,
      reason: `Policy cap reached (${MAX_FOLLOW_UPS_PER_QUESTION} follow-ups exhausted). Moving to next question.`,
    };
  }

  return {
    finalDecision: rawDecision.decision,
    isCapped: false,
    followUp: rawDecision.followUp,
    dimension: rawDecision.dimension,
    reason: rawDecision.reason,
  };
}
