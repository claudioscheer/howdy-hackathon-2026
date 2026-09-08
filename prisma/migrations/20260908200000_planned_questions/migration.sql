-- CreateEnum
CREATE TYPE "QuestionPrepStatus" AS ENUM ('idle', 'generating', 'ready');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "questionPrepStatus" "QuestionPrepStatus" NOT NULL DEFAULT 'idle';

-- CreateTable
CREATE TABLE "PlannedQuestion" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlannedQuestion" ADD CONSTRAINT "PlannedQuestion_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
