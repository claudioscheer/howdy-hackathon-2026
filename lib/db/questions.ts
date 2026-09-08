import type { PlannedQuestion, QuestionPrepStatus } from "@prisma/client";
import { getPrisma } from "./prisma";
import { waitForQuestionPrep } from "./question-prep-wait";

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

function placeholderPrompts(): string[] {
  // TODO: Call the question planner / LLM with the job description and
  // candidate curriculum instead of these stand-in prompts.
  return [
    "Walk through a recent project that maps to this job description.",
    "How would you approach the hardest requirement in this posting?",
    "Tell me about a time your experience would transfer to this opportunity.",
  ];
}

export async function generatePlaceholderQuestions(
  opportunityId: string,
): Promise<void> {
  await getPrisma().opportunity.update({
    where: { id: opportunityId },
    data: { questionPrepStatus: "generating" },
  });
  await waitForQuestionPrep();
  const prompts = placeholderPrompts();
  await getPrisma().plannedQuestion.deleteMany({ where: { opportunityId } });
  await getPrisma().plannedQuestion.createMany({
    data: prompts.map((prompt, sortOrder) => ({
      id: `question-${crypto.randomUUID()}`,
      opportunityId,
      prompt,
      sortOrder,
    })),
  });
  await getPrisma().opportunity.update({
    where: { id: opportunityId },
    data: { questionPrepStatus: "ready" },
  });
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
