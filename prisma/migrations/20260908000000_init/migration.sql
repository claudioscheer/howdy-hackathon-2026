-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('behavioral', 'technical', 'system_design');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('Active', 'Expired', 'Draft');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "targetTechStack" TEXT[],
    "interviewType" "InterviewType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'Draft',
    "attemptsLimit" INTEGER NOT NULL DEFAULT 2,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "token" TEXT NOT NULL,
    "practiceSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_token_key" ON "Opportunity"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_opportunityId_key" ON "Candidate"("opportunityId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
