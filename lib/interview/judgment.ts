import { z } from "zod";
import { RubricDimensionSchema } from "./rubric";

export const ProbePurposeSchema = z.enum([
  "diagnosis",
  "ownership",
  "tradeoff",
  "consequence",
  "contradiction",
  "close",
  "relevance",
  "clarification",
]);
export type ProbePurpose = z.infer<typeof ProbePurposeSchema>;

export const RecommendedStopReasonSchema = z.enum([
  "evidence_sufficient",
  "no_new_information",
  "candidate_cannot_go_deeper",
]);
export type RecommendedStopReason = z.infer<typeof RecommendedStopReasonSchema>;

export const PolicyStopReasonSchema = z.enum([
  "follow_up_cap",
  "topic_budget_exhausted",
  "protect_remaining_core_or_close",
]);
export type PolicyStopReason = z.infer<typeof PolicyStopReasonSchema>;

export const AppliedStopReasonSchema = z.enum([
  "evidence_sufficient",
  "no_new_information",
  "candidate_cannot_go_deeper",
  "follow_up_cap",
  "topic_budget_exhausted",
  "protect_remaining_core_or_close",
  "skipped_optional",
  "skipped_supporting",
  "session_budget_exhausted",
]);
export type AppliedStopReason = z.infer<typeof AppliedStopReasonSchema>;

export const JudgmentEvidenceSchema = z.object({
  quote: z.string().min(1),
  supports: z.string().min(1),
});
export type JudgmentEvidence = z.infer<typeof JudgmentEvidenceSchema>;

const FollowUpDecisionSchema = z
  .object({
    decision: z.literal("FOLLOW_UP"),
    reason: z.string().min(5),
    dimension: RubricDimensionSchema,
    followUp: z.string().trim().min(1),
    probePurpose: ProbePurposeSchema,
    unresolvedGap: z.string().min(1),
    evidence: z.array(JudgmentEvidenceSchema).min(1),
  })
  .superRefine((value, context) => {
    if (value.probePurpose === "contradiction" && value.evidence.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contradiction follow-ups must cite both statements.",
        path: ["evidence"],
      });
    }
  });

const MoveOnDecisionSchema = z.object({
  decision: z.literal("MOVE_ON"),
  reason: z.string().min(5),
  recommendedStopReason: RecommendedStopReasonSchema,
  evidence: z.array(JudgmentEvidenceSchema).min(1),
});

export const InterviewerDecisionSchema = z.discriminatedUnion("decision", [
  FollowUpDecisionSchema,
  MoveOnDecisionSchema,
]);
export type InterviewerDecision = z.infer<typeof InterviewerDecisionSchema>;

export const QuestionOutcomeSchema = z.object({
  questionId: z.string().min(1),
  recommendedDecision: z.enum(["FOLLOW_UP", "MOVE_ON"]).optional(),
  recommendedStopReason: RecommendedStopReasonSchema.optional(),
  appliedStopReason: AppliedStopReasonSchema,
});
export type QuestionOutcome = z.infer<typeof QuestionOutcomeSchema>;

export function ungroundedJudgmentQuotes(
  evidence: JudgmentEvidence[],
  transcript: string,
): string[] {
  return evidence
    .filter((item) => !transcript.includes(item.quote))
    .map((item) => item.quote);
}

export function judgmentEvidenceIsGrounded(
  evidence: JudgmentEvidence[],
  transcript: string,
): boolean {
  return (
    ungroundedJudgmentQuotes(evidence, transcript).length === 0 &&
    evidence.every((item) => item.supports.trim() !== item.quote.trim())
  );
}
