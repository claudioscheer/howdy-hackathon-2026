/** Stack used when a manager left the optional tech stack empty. */
export const FALLBACK_TECH_STACK: readonly string[] = ["General"];

/**
 * The tech stack is optional on the opportunity form, but the interview
 * profile requires at least one entry. Every loader that builds a profile
 * from a stored opportunity goes through here so the fallback cannot drift.
 */
export function profileTechStack(stored: string[]): string[] {
  return stored.length > 0 ? stored : [...FALLBACK_TECH_STACK];
}
