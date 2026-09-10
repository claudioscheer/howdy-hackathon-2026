import { z } from "zod";
import { InterviewerBriefSchema } from "./brief";
import { QuestionOutcomeSchema } from "./judgment";
import { RubricDimensionSchema } from "./rubric";

export { InterviewerBriefSchema, planReadiness } from "./brief";
export type { InterviewerBrief, PlanReadiness } from "./brief";
export {
  AppliedStopReasonSchema,
  InterviewerDecisionSchema,
  JudgmentEvidenceSchema,
  ProbePurposeSchema,
  QuestionOutcomeSchema,
  RecommendedStopReasonSchema,
} from "./judgment";
export type {
  AppliedStopReason,
  InterviewerDecision,
  JudgmentEvidence,
  ProbePurpose,
  QuestionOutcome,
  RecommendedStopReason,
} from "./judgment";
export { RubricDimensionSchema } from "./rubric";
export type { RubricDimension } from "./rubric";

export const DecisionTypeSchema = z.enum(["FOLLOW_UP", "MOVE_ON"]);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

export const InterviewTypeSchema = z.enum([
  "behavioral",
  "technical",
  "system_design",
]);

export const CandidateProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export const OpportunityProfileSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  seniority: z.string().min(1),
  targetTechStack: z.array(z.string().min(1)).min(1),
  interviewType: InterviewTypeSchema,
});
export type OpportunityProfile = z.infer<typeof OpportunityProfileSchema>;

export const DEFAULT_TARGET_MINUTES = 40;
export const DEFAULT_SESSION_ANSWER_BUDGET = 10;

export const InterviewQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  primaryDimension: RubricDimensionSchema,
  brief: InterviewerBriefSchema.optional(),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const UsedQuestionSchema = InterviewQuestionSchema.pick({
  id: true,
  prompt: true,
});

export const QuestionPlanInputSchema = z.object({
  opportunity: OpportunityProfileSchema,
  attemptNumber: z.number().int().min(1),
  usedQuestions: z.array(UsedQuestionSchema),
});

export const QuestionPlanSchema = z.object({
  targetMinutes: z.number().positive().default(DEFAULT_TARGET_MINUTES),
  sessionAnswerBudget: z
    .number()
    .int()
    .positive()
    .default(DEFAULT_SESSION_ANSWER_BUDGET),
  questions: z.array(InterviewQuestionSchema).min(1),
});
export type QuestionPlan = z.infer<typeof QuestionPlanSchema>;

export const TranscriptTurnSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  speaker: z.enum(["interviewer", "candidate"]),
  kind: z.enum(["question", "answer", "follow_up"]),
  content: z.string().min(1),
});
export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>;

export const AnswerEvaluationInputSchema = z.object({
  opportunity: OpportunityProfileSchema,
  question: InterviewQuestionSchema,
  answer: z.string(),
  history: z.array(TranscriptTurnSchema),
});
export type AnswerEvaluationInput = z.infer<typeof AnswerEvaluationInputSchema>;

export const ReportEvidenceSchema = z.object({
  questionId: z.string().min(1),
  quote: z.string().min(1),
  supports: z.string().min(1).optional(),
});

const ScoredDimensionSchema = z.object({
  status: z.literal("scored"),
  score: z.number().int().min(1).max(5),
  summary: z.string().min(1),
  evidence: z.array(ReportEvidenceSchema),
  remainingUnknown: z.string().min(1).optional(),
});

const InsufficientEvidenceDimensionSchema = z.object({
  status: z.literal("insufficient_evidence"),
  summary: z.string().min(1),
  evidence: z.array(ReportEvidenceSchema),
  remainingUnknown: z.string().min(1),
});

export const ReportDimensionSchema = z.discriminatedUnion("status", [
  ScoredDimensionSchema,
  InsufficientEvidenceDimensionSchema,
]);

export const SessionReportSchema = z.object({
  attemptNumber: z.number().int().min(1),
  summary: z.string().min(1),
  dimensions: z.object({
    relevance: ReportDimensionSchema,
    specificity: ReportDimensionSchema,
    fundamentals: ReportDimensionSchema,
    structure: ReportDimensionSchema,
  }),
});
export type SessionReport = z.infer<typeof SessionReportSchema>;

export const ReportEvaluationInputSchema = z.object({
  opportunity: OpportunityProfileSchema,
  attemptNumber: z.number().int().min(1),
  transcript: z.array(TranscriptTurnSchema).min(1),
  questions: z.array(InterviewQuestionSchema).min(1),
  questionOutcomes: z.array(QuestionOutcomeSchema),
});

export interface QuestionPlanner {
  plan(input: z.infer<typeof QuestionPlanInputSchema>): Promise<unknown>;
}

export interface AnswerEvaluator {
  evaluate(input: AnswerEvaluationInput): Promise<unknown>;
}

export interface ReportEvaluator {
  evaluate(
    input: z.infer<typeof ReportEvaluationInputSchema>,
  ): Promise<unknown>;
}
