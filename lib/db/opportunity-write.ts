import type { Candidate, Opportunity } from "@prisma/client";
import { InterviewTypeSchema } from "@/lib/interview/contracts";
import type { CreateOpportunityInput } from "./opportunity-input";
import {
  OpportunityRoleSchema,
  OpportunitySenioritySchema,
} from "./opportunity-options";
import { getPrisma } from "./prisma";

function parsedRole(value: string): CreateOpportunityInput["role"] {
  const parsed = OpportunityRoleSchema.safeParse(value);
  return parsed.success ? parsed.data : "fullstack";
}

function parsedSeniority(value: string): CreateOpportunityInput["seniority"] {
  const parsed = OpportunitySenioritySchema.safeParse(value);
  return parsed.success ? parsed.data : "senior";
}

export function parsedInterviewType(
  value: string,
): CreateOpportunityInput["interviewType"] {
  const parsed = InterviewTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "behavioral";
}

export type OpportunityEditRecord = Opportunity & {
  candidate: Candidate | null;
};

export async function getOpportunityForEdit(
  id: string,
): Promise<OpportunityEditRecord | null> {
  return getPrisma().opportunity.findUnique({
    where: { id },
    include: { candidate: true },
  });
}

export function toCreateInput(
  record: OpportunityEditRecord,
): CreateOpportunityInput {
  return {
    candidateDisplayName: record.candidate?.displayName ?? "",
    role: parsedRole(record.role),
    seniority: parsedSeniority(record.seniority),
    targetTechStack: record.targetTechStack,
    interviewType: parsedInterviewType(record.interviewType),
    jobDescription: record.jobDescription,
    curriculum: record.candidate?.curriculum ?? "",
  };
}

export async function updateOpportunityWithCandidate(
  id: string,
  input: CreateOpportunityInput,
): Promise<void> {
  const prisma = getPrisma();
  await prisma.opportunity.update({
    where: { id },
    data: {
      role: input.role,
      seniority: input.seniority,
      targetTechStack: input.targetTechStack,
      interviewType: input.interviewType,
      jobDescription: input.jobDescription,
      candidate: {
        upsert: {
          update: {
            displayName: input.candidateDisplayName,
            curriculum: input.curriculum,
          },
          create: {
            id: `candidate-${crypto.randomUUID()}`,
            displayName: input.candidateDisplayName,
            curriculum: input.curriculum,
          },
        },
      },
    },
  });
}
