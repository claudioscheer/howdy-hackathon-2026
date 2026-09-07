import {
  DecisionTypeSchema,
  InterviewerDecisionSchema,
  RubricDimensionSchema,
  type DecisionType,
  type InterviewerDecision,
  type RubricDimension,
} from "../interview/contracts";
import { MAX_SESSION_ATTEMPTS } from "../interview/session";

export { DecisionTypeSchema, InterviewerDecisionSchema, RubricDimensionSchema };
export type { DecisionType, InterviewerDecision, RubricDimension };

export interface FeedbackNote {
  quote: string;
  dimension: RubricDimension;
  feedback: string;
}

export function validateTranscriptGrounding(
  notes: FeedbackNote[],
  transcript: string,
): { valid: boolean; ungroundedQuotes: string[] } {
  const ungroundedQuotes = notes
    .filter((note) => !note.quote || !transcript.includes(note.quote))
    .map((note) => note.quote);
  return {
    valid: ungroundedQuotes.length === 0,
    ungroundedQuotes,
  };
}

export const MAX_SESSION_RETRIES = MAX_SESSION_ATTEMPTS;

export function isSessionRetryAllowed(attemptNumber: number): boolean {
  return attemptNumber < MAX_SESSION_RETRIES;
}
