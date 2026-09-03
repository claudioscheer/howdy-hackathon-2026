import { z } from "zod";
import {
  AnswerEvaluationInputSchema,
  DecisionTypeSchema,
  InterviewerDecisionSchema,
  RubricDimensionSchema,
  type AnswerEvaluationInput,
  type DecisionType,
  type InterviewerDecision,
  type RubricDimension,
} from "../interview/contracts";
import {
  MAX_FOLLOW_UPS_PER_QUESTION,
  MAX_SESSION_ATTEMPTS,
} from "../interview/session";

/**
 * Layer 0: Deterministic Contracts
 * Core data contracts for interview decisions, evaluation rubrics,
 * state machine constraints, and transcript grounding.
 */

export {
  DecisionTypeSchema,
  InterviewerDecisionSchema,
  MAX_FOLLOW_UPS_PER_QUESTION,
  RubricDimensionSchema,
};
export type { DecisionType, InterviewerDecision, RubricDimension };

export const EvaluationInputSchema = AnswerEvaluationInputSchema;
export type EvaluationInput = AnswerEvaluationInput;

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

export const MAX_SESSION_RETRIES = MAX_SESSION_ATTEMPTS;

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

  if (rawDecision.decision === "FOLLOW_UP") {
    return {
      finalDecision: "FOLLOW_UP",
      isCapped: false,
      followUp: rawDecision.followUp,
      dimension: rawDecision.dimension,
      reason: rawDecision.reason,
    };
  }

  return {
    finalDecision: "MOVE_ON",
    isCapped: false,
    reason: rawDecision.reason,
  };
}
