import type { PlannedQuestion, QuestionPrepStatus } from "@prisma/client";
import {
  OpportunityProfileSchema,
  QuestionPlanSchema,
} from "@/lib/interview/contracts";
import {
  createOpenCodeQuestionGenerator,
  type QuestionBriefing,
  type QuestionGenerator,
} from "@/lib/interview/planner";
import { getPrisma } from "./prisma";

export async function listPlannedQuestions(
  opportunityId: string,
): Promise<PlannedQuestion[]> {
  return getPrisma().plannedQuestion.findMany({
    where: { opportunityId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getQuestionPrepStatus(
  opportunityId: string,
): Promise<QuestionPrepStatus | null> {
  const row = await getPrisma().opportunity.findUnique({
    where: { id: opportunityId },
    select: { questionPrepStatus: true },
  });
  return row?.questionPrepStatus ?? null;
}

export async function generatePlannedQuestions(
  opportunityId: string,
  generator: QuestionGenerator = createOpenCodeQuestionGenerator(),
): Promise<void> {
  const prisma = getPrisma();
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { questionPrepStatus: "generating" },
  });
  try {
    const briefing = await loadQuestionBriefing(opportunityId);
    const parsed = QuestionPlanSchema.safeParse(await generator.plan(briefing));
    if (!parsed.success) {
      throw new Error("The question planner returned an invalid plan.");
    }
    await savePlannedQuestions(
      opportunityId,
      parsed.data.questions.map((question) => question.prompt),
    );
  } catch (error) {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { questionPrepStatus: "idle" },
    });
    throw error;
  }
}

export async function loadQuestionBriefing(
  opportunityId: string,
): Promise<QuestionBriefing> {
  const row = await getPrisma().opportunity.findUnique({
    where: { id: opportunityId },
    include: { candidate: true },
  });
  if (row === null) {
    throw new Error("Opportunity not found.");
  }
  const opportunity = OpportunityProfileSchema.safeParse({
    id: row.id,
    role: row.role,
    seniority: row.seniority,
    targetTechStack: row.targetTechStack,
    interviewType: row.interviewType,
  });
  if (!opportunity.success) {
    throw new Error("Opportunity is missing planner fields.");
  }
  return {
    opportunity: opportunity.data,
    attemptNumber: 1,
    usedQuestions: [],
    jobDescription: row.jobDescription,
    curriculum: row.candidate?.curriculum ?? "",
  };
}

export async function savePlannedQuestions(
  opportunityId: string,
  prompts: string[],
): Promise<void> {
  const trimmed = prompts.map((prompt) => prompt.trim()).filter(Boolean);
  await getPrisma().plannedQuestion.deleteMany({ where: { opportunityId } });
  if (trimmed.length > 0) {
    await getPrisma().plannedQuestion.createMany({
      data: trimmed.map((prompt, sortOrder) => ({
        id: `question-${crypto.randomUUID()}`,
        opportunityId,
        prompt,
        sortOrder,
      })),
    });
  }
  await getPrisma().opportunity.update({
    where: { id: opportunityId },
    data: {
      questionPrepStatus: trimmed.length > 0 ? "ready" : "idle",
    },
  });
}
