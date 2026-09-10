import {
  createOpenCodeQuestionGenerator,
  type QuestionGenerator,
} from "@/lib/interview/planner";
import { getPrisma } from "./prisma";
import {
  generatePlannedQuestions,
  getOpportunityQuestionPrep,
} from "./questions";

const generationErrors = new Map<string, string>();

export function getGenerationError(opportunityId: string): string | undefined {
  return generationErrors.get(opportunityId);
}

export function recordGenerationError(
  opportunityId: string,
  error: unknown,
): void {
  const message =
    error instanceof Error ? error.message : "Question generation failed.";
  generationErrors.set(opportunityId, message);
}

export function clearGenerationError(opportunityId: string): void {
  generationErrors.delete(opportunityId);
}

export async function startQuestionGeneration(
  opportunityId: string,
  generator?: QuestionGenerator,
): Promise<void> {
  const prep = await getOpportunityQuestionPrep(opportunityId);
  if (prep === null) {
    throw new Error("Opportunity not found.");
  }
  if (prep.status === "generating") {
    return;
  }
  clearGenerationError(opportunityId);
  await getPrisma().opportunity.update({
    where: { id: opportunityId },
    data: { questionPrepStatus: "generating" },
  });
  const activeGenerator = generator ?? createOpenCodeQuestionGenerator();
  void generatePlannedQuestions(opportunityId, activeGenerator).catch(
    (error: unknown) => {
      recordGenerationError(opportunityId, error);
    },
  );
}
