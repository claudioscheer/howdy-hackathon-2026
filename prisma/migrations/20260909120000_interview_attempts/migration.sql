-- CreateTable
CREATE TABLE "InterviewAttempt" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "questionOutcomes" JSONB NOT NULL,
    "usedQuestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAttempt_opportunityId_attemptNumber_key" ON "InterviewAttempt"("opportunityId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
