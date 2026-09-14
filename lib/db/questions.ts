import type {
  InterviewType,
  PlannedQuestion,
  QuestionPrepStatus,
} from "@prisma/client";
import {
  OpportunityProfileSchema,
  QuestionPlanSchema,
} from "@/lib/interview/contracts";
import { briefedPlanProblems } from "@/lib/interview/plan-quality";
import {
  createOpenCodeQuestionGenerator,
  type QuestionBriefing,
  type QuestionGenerator,
} from "@/lib/interview/planner";
import {
  draftFromInterviewQuestion,
  prismaQuestionData,
  type QuestionDraft,
} from "./question-drafts";
import { saveDraftProblems, type PlanSettings } from "./question-plan";
import { effectiveQuestionPrepStatus } from "./question-prep-status";
import { getPrisma } from "./prisma";

export type OpportunityQuestionPrep = {
  status: QuestionPrepStatus;
  targetMinutes: number;
  sessionAnswerBudget: number;
  practiceSessionId: string | null;
  interviewType: InterviewType;
};

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
  const row = await getOpportunityQuestionPrep(opportunityId);
  return row?.status ?? null;
}

export async function getOpportunityQuestionPrep(
  opportunityId: string,
): Promise<OpportunityQuestionPrep | null> {
  const row = await getPrisma().opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      questionPrepStatus: true,
      targetMinutes: true,
      sessionAnswerBudget: true,
      practiceSessionId: true,
      interviewType: true,
      updatedAt: true,
    },
  });
  if (row === null) {
    return null;
  }
  return {
    status: effectiveQuestionPrepStatus(row.questionPrepStatus, row.updatedAt),
    targetMinutes: row.targetMinutes,
    sessionAnswerBudget: row.sessionAnswerBudget,
    practiceSessionId: row.practiceSessionId,
    interviewType: row.interviewType,
  };
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
    const problems = briefedPlanProblems(
      parsed.data,
      briefing.opportunity.interviewType,
    );
    if (problems.length > 0) {
      throw new Error("The question planner returned an invalid plan.");
    }
    await savePlannedQuestions(
      opportunityId,
      parsed.data.questions.map(draftFromInterviewQuestion),
      {
        targetMinutes: parsed.data.targetMinutes,
        sessionAnswerBudget: parsed.data.sessionAnswerBudget,
      },
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
  drafts: QuestionDraft[],
  settings?: PlanSettings,
): Promise<void> {
  const trimmed = drafts.filter((draft) => draft.prompt.trim().length > 0);
  const prep = await getOpportunityQuestionPrep(opportunityId);
  if (prep === null) {
    throw new Error("Opportunity not found.");
  }
  const planSettings = settings ?? {
    targetMinutes: prep.targetMinutes,
    sessionAnswerBudget: prep.sessionAnswerBudget,
  };
  if (trimmed.length > 0) {
    const problems = saveDraftProblems(
      trimmed,
      planSettings,
      prep.interviewType,
    );
    if (problems.length > 0) {
      throw new Error(problems[0]);
    }
  }
  await persistQuestions(opportunityId, trimmed, planSettings);
}

async function persistQuestions(
  opportunityId: string,
  trimmed: QuestionDraft[],
  settings: PlanSettings,
): Promise<void> {
  const prisma = getPrisma();
  // One transaction: a failed insert must not leave the old plan deleted
  // while the status still claims the opportunity is ready.
  await prisma.$transaction([
    prisma.plannedQuestion.deleteMany({ where: { opportunityId } }),
    ...(trimmed.length > 0
      ? [
          prisma.plannedQuestion.createMany({
            data: trimmed.map((draft, sortOrder) =>
              prismaQuestionData(opportunityId, draft, sortOrder),
            ),
          }),
        ]
      : []),
    prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        questionPrepStatus: trimmed.length > 0 ? "ready" : "idle",
        targetMinutes: settings.targetMinutes,
        sessionAnswerBudget: settings.sessionAnswerBudget,
      },
    }),
  ]);
}
