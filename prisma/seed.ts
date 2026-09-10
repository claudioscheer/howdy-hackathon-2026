import { PrismaClient } from "@prisma/client";
import { SEEDED_QUESTION_PLAN, SEEDED_SESSION_ID } from "../lib/interview/seed";

const prisma = new PrismaClient();

const SEEDED_OPPORTUNITIES = [
  {
    id: "opp-1",
    role: "infrastructure",
    seniority: "senior",
    targetTechStack: ["Go", "Kubernetes", "PostgreSQL"],
    interviewType: "system_design" as const,
    jobDescription:
      "Own multi-region services, incident response, and API contracts. You will design failure domains, review capacity plans, and mentor engineers through production incidents.",
    status: "Expired" as const,
    attemptsLimit: 2,
    attemptsUsed: 2,
    token: "sys-9f82a",
    practiceSessionId: "opp-1",
    questionPrepStatus: "idle" as const,
    candidate: {
      id: "candidate-jordan-hale",
      displayName: "Jordan Hale",
      curriculum:
        "Jordan Hale. 8 years in platform engineering. Led a Go/Kubernetes migration, cut p99 latency 40%, and ran weekly incident reviews.",
    },
  },
  {
    id: "opp-2",
    role: "fullstack",
    seniority: "senior",
    targetTechStack: ["React", "Node.js", "PostgreSQL"],
    interviewType: "behavioral" as const,
    jobDescription:
      "Ship product features across React, Node.js, and PostgreSQL. You will make API design tradeoffs, pair with design, and keep delivery risk visible.",
    status: "Active" as const,
    attemptsLimit: 2,
    attemptsUsed: 0,
    token: "fs-3b17c",
    practiceSessionId: SEEDED_SESSION_ID,
    questionPrepStatus: "ready" as const,
    candidate: {
      id: "candidate-alex-rivera",
      displayName: "Alex Rivera",
      curriculum:
        "Alex Rivera. Fullstack engineer. Shipped TypeScript contract tests, led a three-person API migration, and reduced partner errors 42%.",
    },
  },
  {
    id: "opp-3",
    role: "infrastructure",
    seniority: "staff",
    targetTechStack: ["Kubernetes", "Terraform", "AWS"],
    interviewType: "technical" as const,
    jobDescription:
      "Raise cluster reliability on Kubernetes, Terraform, and AWS. You will set SLOs, design failover, and teach on-call practices.",
    status: "Active" as const,
    attemptsLimit: 2,
    attemptsUsed: 1,
    token: "infra-48d0e",
    practiceSessionId: "opp-3",
    questionPrepStatus: "idle" as const,
    candidate: {
      id: "candidate-sam-okonkwo",
      displayName: "Sam Okonkwo",
      curriculum:
        "Sam Okonkwo. Staff infrastructure. Built multi-AZ Terraform modules, ran Kubernetes upgrades, and wrote the on-call handbook.",
    },
  },
];

async function seedOpportunity(
  opportunity: (typeof SEEDED_OPPORTUNITIES)[number],
): Promise<void> {
  const { candidate, ...data } = opportunity;
  await prisma.interviewAttempt.deleteMany({
    where: { opportunityId: data.id },
  });
  await prisma.opportunity.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
  await prisma.candidate.upsert({
    where: { id: candidate.id },
    update: {
      displayName: candidate.displayName,
      curriculum: candidate.curriculum,
      opportunityId: data.id,
    },
    create: {
      id: candidate.id,
      displayName: candidate.displayName,
      curriculum: candidate.curriculum,
      opportunityId: data.id,
    },
  });
}

async function seedDemoQuestions(): Promise<void> {
  await prisma.plannedQuestion.deleteMany({
    where: { opportunityId: { in: ["opp-1", "opp-2", "opp-3"] } },
  });
  await prisma.plannedQuestion.createMany({
    data: SEEDED_QUESTION_PLAN.map((question, sortOrder) => ({
      id: question.id,
      opportunityId: "opp-2",
      prompt: question.prompt,
      sortOrder,
      primaryDimension: question.primaryDimension,
    })),
  });
}

async function main(): Promise<void> {
  for (const opportunity of SEEDED_OPPORTUNITIES) {
    await seedOpportunity(opportunity);
  }
  await seedDemoQuestions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
