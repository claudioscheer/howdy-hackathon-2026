-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "targetMinutes" INTEGER NOT NULL DEFAULT 40;
ALTER TABLE "Opportunity" ADD COLUMN "sessionAnswerBudget" INTEGER NOT NULL DEFAULT 10;
