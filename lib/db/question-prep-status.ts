import type { QuestionPrepStatus } from "@prisma/client";

/**
 * Question generation runs in the web process. If that process recycles
 * mid-job, nothing ever clears `generating`, so a row that has not changed in
 * this window is treated as abandoned and the manager can generate again.
 */
export const STALE_GENERATION_MS = 5 * 60 * 1000;

export function effectiveQuestionPrepStatus(
  status: QuestionPrepStatus,
  updatedAt: Date,
  now: Date = new Date(),
): QuestionPrepStatus {
  if (
    status === "generating" &&
    now.getTime() - updatedAt.getTime() > STALE_GENERATION_MS
  ) {
    return "idle";
  }
  return status;
}
