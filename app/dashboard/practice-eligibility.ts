import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { MAX_SESSION_ATTEMPTS } from "@/lib/interview/session";

export function canOpenPractice(item: OpportunityItem): boolean {
  return (
    item.status === "Active" &&
    item.questionPrepStatus === "ready" &&
    item.questionCount > 0 &&
    item.attemptsUsed < MAX_SESSION_ATTEMPTS
  );
}

export function countOpenablePractice(
  items: readonly OpportunityItem[],
): number {
  return items.filter(canOpenPractice).length;
}
