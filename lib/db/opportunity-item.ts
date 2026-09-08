export interface OpportunityItem {
  id: string;
  role: string;
  seniority: string;
  track: string;
  attemptsLimit: number;
  attemptsUsed: number;
  status: "Active" | "Expired" | "Draft";
  token: string;
  practiceSessionId?: string;
  candidateName?: string;
  hasBriefing: boolean;
  questionCount: number;
  questionPrepStatus: "idle" | "generating" | "ready";
}

export function practicePath(item: {
  id: string;
  practiceSessionId?: string;
}): string {
  return `/practice/${item.practiceSessionId ?? item.id}`;
}

export function formatTechStackTrack(stack: readonly string[]): string {
  return stack.join(", ");
}

export function hasStoredBriefing(
  jobDescription: string,
  curriculum: string | undefined,
): boolean {
  return (
    jobDescription.trim().length > 0 && (curriculum ?? "").trim().length > 0
  );
}
