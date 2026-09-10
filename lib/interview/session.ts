import { z } from "zod";
import {
  CandidateProfileSchema,
  DEFAULT_SESSION_ANSWER_BUDGET,
  InterviewerDecisionSchema,
  InterviewQuestionSchema,
  OpportunityProfileSchema,
  QuestionOutcomeSchema,
  SessionReportSchema,
  TranscriptTurnSchema,
  UsedQuestionSchema,
} from "./contracts";

export const MAX_FOLLOW_UPS_PER_QUESTION = 2;
export const MAX_SESSION_ATTEMPTS = 2;
export { DEFAULT_SESSION_ANSWER_BUDGET };

export const SessionStatusSchema = z.enum([
  "PLANNED",
  "AWAITING_ANSWER",
  "EVALUATING_ANSWER",
  "GENERATING_REPORT",
  "COMPLETE",
]);

export const EvaluationPathSchema = z.enum(["basic", "briefed"]);

export const SessionStateSchema = z.object({
  sessionId: z.string().min(1),
  status: SessionStatusSchema,
  candidate: CandidateProfileSchema,
  opportunity: OpportunityProfileSchema,
  attemptNumber: z.number().int().min(1).max(MAX_SESSION_ATTEMPTS),
  questions: z.array(InterviewQuestionSchema).min(1),
  questionIndex: z.number().int().nonnegative(),
  followUpCount: z.number().int().min(0).max(MAX_FOLLOW_UPS_PER_QUESTION),
  sessionAnswerBudget: z.number().int().positive(),
  sessionAnswersUsed: z.number().int().nonnegative(),
  questionAnswersUsed: z.number().int().nonnegative(),
  evaluationPath: EvaluationPathSchema,
  questionOutcomes: z.array(QuestionOutcomeSchema),
  history: z.array(TranscriptTurnSchema),
  completedQuestionIds: z.array(z.string().min(1)),
  usedQuestions: z.array(UsedQuestionSchema),
  report: SessionReportSchema.optional(),
});
export type SessionState = z.infer<typeof SessionStateSchema>;

export const SessionEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("START_SESSION") }),
  z.object({
    type: z.literal("ANSWER_SUBMITTED"),
    answer: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("ANSWER_EVALUATED"),
    decision: InterviewerDecisionSchema,
  }),
  z.object({
    type: z.literal("REPORT_GENERATED"),
    report: SessionReportSchema,
  }),
]);
export type SessionEvent = z.infer<typeof SessionEventSchema>;

export type SessionReducer = (
  state: SessionState,
  event: SessionEvent,
) => SessionState;
