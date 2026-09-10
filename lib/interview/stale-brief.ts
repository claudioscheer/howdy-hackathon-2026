export type BriefIdentity = {
  prompt: string;
  competency: string;
};

export function isMaterialBriefEdit(
  previous: BriefIdentity,
  next: BriefIdentity,
): boolean {
  return (
    previous.prompt.trim() !== next.prompt.trim() ||
    previous.competency.trim() !== next.competency.trim()
  );
}

export function competencyChanged(
  previous: BriefIdentity,
  next: BriefIdentity,
): boolean {
  return previous.competency.trim() !== next.competency.trim();
}
