import { z } from "zod";

export const QuestionImportanceSchema = z.enum([
  "core",
  "supporting",
  "optional",
]);
export type QuestionImportance = z.infer<typeof QuestionImportanceSchema>;

export const InterviewerBriefSchema = z.object({
  competency: z.string().min(1),
  roleRelevance: z.string().min(1),
  importance: QuestionImportanceSchema,
  expectedDepth: z.string().min(1),
  evidenceToListenFor: z.array(z.string().min(1)).min(1),
  followUpTriggers: z.array(z.string().min(1)).min(1),
  timeBudgetMinutes: z.number().positive(),
  answerBudget: z.number().int().positive(),
  maxFollowUps: z.union([z.literal(1), z.literal(2)]),
  stopWhen: z.array(z.string().min(1)).min(1),
});
export type InterviewerBrief = z.infer<typeof InterviewerBriefSchema>;

export const PlanReadinessSchema = z.enum([
  "prompt_only",
  "briefs_incomplete",
  "briefed",
]);
export type PlanReadiness = z.infer<typeof PlanReadinessSchema>;

export function planReadiness(
  questions: Array<{ brief?: InterviewerBrief }>,
): PlanReadiness {
  const briefedCount = questions.filter(
    (question) => question.brief !== undefined,
  ).length;
  if (briefedCount === 0) {
    return "prompt_only";
  }
  if (briefedCount < questions.length) {
    return "briefs_incomplete";
  }
  return "briefed";
}

export function canEnableBriefedEvaluation(
  questions: Array<{ brief?: InterviewerBrief }>,
): boolean {
  return planReadiness(questions) === "briefed";
}

export function parseInterviewerBrief(
  value: unknown,
): InterviewerBrief | undefined {
  const parsed = InterviewerBriefSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
