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
    }
  );

export type InterviewerDecision = z.infer<typeof InterviewerDecisionSchema>;

/**
 * Grounding verification: Every quote in a feedback report must
 * match a verbatim substring in the candidate's transcript.
 */
export interface FeedbackNote {
  quote: string;
  dimension: RubricDimension;
  feedback: string;
}

export function validateTranscriptGrounding(
  notes: FeedbackNote[],
  transcript: string
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

/**
 * State machine limits: Cap follow-ups per question and retries per session.
 */
export const MAX_FOLLOW_UPS_PER_QUESTION = 2; // Max 2 follow-ups allowed per question
export const MAX_SESSION_RETRIES = 3;

export interface QuestionState {
  questionId: string;
  followUpCount: number;
  isComplete: boolean;
}

export function resolveDecisionWithPolicy(
  rawDecision: InterviewerDecision,
  currentState: QuestionState
): {
  finalDecision: DecisionType;
  isCapped: boolean;
  followUp?: string;
  dimension?: RubricDimension;
  reason: string;
} {
  // If decision is FOLLOW_UP but cap is exhausted, force MOVE_ON
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
