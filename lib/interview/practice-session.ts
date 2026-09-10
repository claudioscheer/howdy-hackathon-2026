import type { Candidate, Opportunity, PlannedQuestion } from "@prisma/client";
import { connection } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { storedBrief } from "@/lib/db/question-drafts";
import { canEnableBriefedEvaluation } from "./brief";
import {
  OpportunityProfileSchema,
  RubricDimensionSchema,
  type InterviewQuestion,
} from "./contracts";
import { createSeededSession, SEEDED_SESSION_ID } from "./seed";
import type { SessionState } from "./session";

type OpportunityPracticeRow = Opportunity & {
  candidate: Candidate | null;
  questions: PlannedQuestion[];
};

export function interviewQuestionsFromRows(
  rows: PlannedQuestion[],
): InterviewQuestion[] {
  return rows.map((row) => {
    const dimension = RubricDimensionSchema.safeParse(row.primaryDimension);
    return {
      id: row.id,
      prompt: row.prompt,
      primaryDimension: dimension.success ? dimension.data : "specificity",
      brief: storedBrief(row.brief),
    };
  });
}

export function sessionFromOpportunity(
  row: OpportunityPracticeRow,
  sessionId: string,
): SessionState | null {
  const questions = interviewQuestionsFromRows(row.questions);
  if (questions.length === 0) {
    return null;
  }
  const opportunity = OpportunityProfileSchema.safeParse({
    id: row.id,
    role: row.role,
    seniority: row.seniority,
    targetTechStack:
      row.targetTechStack.length > 0 ? row.targetTechStack : ["General"],
    interviewType: row.interviewType,
  });
  if (!opportunity.success) {
    return null;
  }
  const candidate = row.candidate;
  if (candidate === null) {
    return null;
  }
  return {
    sessionId,
    status: "PLANNED",
    candidate: {
      id: candidate.id,
      displayName: candidate.displayName,
    },
    opportunity: opportunity.data,
    attemptNumber: 1,
    questions,
    questionIndex: 0,
    followUpCount: 0,
    sessionAnswerBudget: row.sessionAnswerBudget,
    sessionAnswersUsed: 0,
    questionAnswersUsed: 0,
    evaluationPath: canEnableBriefedEvaluation(questions) ? "briefed" : "basic",
    questionOutcomes: [],
    history: [],
    completedQuestionIds: [],
    usedQuestions: [],
  };
}

export async function loadPracticeSession(
  sessionId: string,
): Promise<SessionState | null> {
  await connection();
  const row = await getPrisma().opportunity.findFirst({
    where: {
      OR: [{ practiceSessionId: sessionId }, { id: sessionId }],
    },
    include: {
      candidate: true,
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (row !== null) {
    const fromOpportunity = sessionFromOpportunity(row, sessionId);
    if (fromOpportunity !== null) {
      return fromOpportunity;
    }
  }
  if (sessionId === SEEDED_SESSION_ID) {
    return createSeededSession(sessionId);
  }
  return null;
}
