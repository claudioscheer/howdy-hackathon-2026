-- CreateEnum
CREATE TYPE "QuestionImportance" AS ENUM ('core', 'supporting', 'optional');

-- AlterTable
ALTER TABLE "PlannedQuestion" ADD COLUMN "primaryDimension" TEXT NOT NULL DEFAULT 'specificity';
ALTER TABLE "PlannedQuestion" ADD COLUMN "importance" "QuestionImportance";
ALTER TABLE "PlannedQuestion" ADD COLUMN "competency" TEXT;
ALTER TABLE "PlannedQuestion" ADD COLUMN "brief" JSONB;
