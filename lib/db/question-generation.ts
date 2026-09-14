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
  // Build the generator first: a missing OPENCODE_API_KEY throws here, before
  // the row is marked generating, so the manager sees the error and can retry.
  const activeGenerator = generator ?? createOpenCodeQuestionGenerator();
  await getPrisma().opportunity.update({
    where: { id: opportunityId },
    data: { questionPrepStatus: "generating" },
  });
  void generatePlannedQuestions(opportunityId, activeGenerator).catch(
    (error: unknown) => failGeneration(opportunityId, error),
  );
}

async function failGeneration(
  opportunityId: string,
  error: unknown,
): Promise<void> {
  recordGenerationError(opportunityId, error);
  // generatePlannedQuestions resets to idle itself, but that write (or its
  // opening "generating" write) can fail too. Only clear a row still marked
  // generating so a newer finished plan is never downgraded.
  try {
    await getPrisma().opportunity.updateMany({
      where: { id: opportunityId, questionPrepStatus: "generating" },
      data: { questionPrepStatus: "idle" },
    });
  } catch {
    // The stale-generation window still lets the manager retry.
  }
}
