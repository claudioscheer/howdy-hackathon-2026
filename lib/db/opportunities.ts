import { connection } from "next/server";
import type { Candidate, Opportunity } from "@prisma/client";
import {
  formatTechStackTrack,
  hasStoredBriefing,
  type OpportunityItem,
} from "./opportunity-item";
import type { CreateOpportunityInput } from "./opportunity-input";
import { getPrisma } from "./prisma";
import { effectiveQuestionPrepStatus } from "./question-prep-status";

type OpportunityWithCandidate = Opportunity & {
  candidate: Candidate | null;
  _count?: { questions: number };
};

export function toOpportunityItem(
  row: OpportunityWithCandidate,
): OpportunityItem {
  const practiceSessionId = row.practiceSessionId;
  return {
    id: row.id,
    role: row.role,
    seniority: row.seniority,
    track: formatTechStackTrack(row.targetTechStack),
    attemptsLimit: row.attemptsLimit,
    attemptsUsed: row.attemptsUsed,
    status: row.status,
    token: row.token,
    practiceSessionId:
      practiceSessionId === null ? undefined : practiceSessionId,
    candidateName: row.candidate?.displayName,
    hasBriefing: hasStoredBriefing(
      row.jobDescription,
      row.candidate?.curriculum,
    ),
    questionCount: row._count?.questions ?? 0,
    questionPrepStatus: effectiveQuestionPrepStatus(
      row.questionPrepStatus,
      row.updatedAt,
    ),
  };
}

export async function listDashboardOpportunities(): Promise<OpportunityItem[]> {
  await connection();
  const rows = await getPrisma().opportunity.findMany({
    include: { candidate: true, _count: { select: { questions: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toOpportunityItem);
}

export async function createOpportunityWithCandidate(
  input: CreateOpportunityInput,
): Promise<OpportunityItem> {
  const id = `opp-${crypto.randomUUID()}`;
  const created = await getPrisma().opportunity.create({
    data: {
      id,
      role: input.role,
      seniority: input.seniority,
      targetTechStack: input.targetTechStack,
      interviewType: input.interviewType,
      jobDescription: input.jobDescription,
      status: "Active",
      questionPrepStatus: "idle",
      attemptsLimit: 2,
      attemptsUsed: 0,
      token: crypto.randomUUID().slice(0, 8),
      practiceSessionId: id,
      candidate: {
        create: {
          id: `candidate-${crypto.randomUUID()}`,
          displayName: input.candidateDisplayName,
          curriculum: input.curriculum,
        },
      },
    },
    include: { candidate: true, _count: { select: { questions: true } } },
  });
  return toOpportunityItem(created);
}
