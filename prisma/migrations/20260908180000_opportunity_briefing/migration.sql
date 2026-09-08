-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "jobDescription" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "curriculum" TEXT NOT NULL DEFAULT '';
