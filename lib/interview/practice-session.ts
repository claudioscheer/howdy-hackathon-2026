import type { Candidate, Opportunity, PlannedQuestion } from "@prisma/client";
import { connection } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { storedBrief } from "@/lib/db/question-drafts";
import { canEnableBriefedEvaluation } from "./brief";
import {
  DEFAULT_TARGET_MINUTES,
  OpportunityProfileSchema,
  RubricDimensionSchema,
  type InterviewQuestion,
} from "./contracts";
import {
  loadLatestAttempt,
  reportFromStored,
} from "@/lib/db/practice-attempts";
import { createSeededSession, SEEDED_SESSION_ID } from "./seed";
import { MAX_SESSION_ATTEMPTS, type SessionState } from "./session";

export type PracticePageData = {
  session: SessionState;
  targetMinutes: number;
};

type OpportunityPracticeRow = Opportunity & {
  candidate: Candidate | null;
  questions: PlannedQuestion[];
};

function nextAttemptNumber(attemptsUsed: number): number {
  return Math.min(Math.max(attemptsUsed + 1, 1), MAX_SESSION_ATTEMPTS);
}

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
    attemptNumber: nextAttemptNumber(row.attemptsUsed),
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
  const loaded = await loadPracticePageData(sessionId);
  return loaded?.session ?? null;
}

export async function loadPracticePageData(
  sessionId: string,
): Promise<PracticePageData | null> {
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
      const completed = await completedFromStoredAttempts(
        row.id,
        row.attemptsUsed,
        row.attemptsLimit,
        fromOpportunity,
      );
      return {
        session: completed ?? fromOpportunity,
        targetMinutes: row.targetMinutes,
      };
    }
  }
  if (sessionId === SEEDED_SESSION_ID) {
    return {
      session: createSeededSession(sessionId),
      targetMinutes: DEFAULT_TARGET_MINUTES,
    };
  }
  return null;
}

async function completedFromStoredAttempts(
  opportunityId: string,
  attemptsUsed: number,
  attemptsLimit: number,
  session: SessionState,
): Promise<SessionState | null> {
  if (attemptsUsed < attemptsLimit) {
    return null;
  }
  const stored = await loadLatestAttempt(opportunityId);
  if (stored === null) {
    return null;
  }
  const report = reportFromStored(stored);
  if (report === null) {
    return null;
  }
  return {
    ...session,
    status: "COMPLETE",
    attemptNumber: report.attemptNumber,
    report,
  };
}
