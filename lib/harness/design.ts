export const FORBIDDEN_MARKETING_ACCENT_CLASSES = [
  "bg-blue-",
  "text-blue-",
  "bg-indigo-",
  "text-indigo-",
  "bg-purple-",
  "text-purple-",
  "bg-emerald-",
  "text-emerald-",
  "bg-red-",
  "text-red-",
  "bg-amber-",
  "text-amber-",
  "bg-yellow-",
  "text-yellow-",
] as const;

export interface DesignValidationResult {
  valid: boolean;
  reasons: string[];
}

export function extractElementSnippet(
  source: string,
  testId: string,
): string | null {
  const marker = `data-testid="${testId}"`;
  const index = source.indexOf(marker);
  if (index === -1) {
    return null;
  }
  const openTag = source.lastIndexOf("<", index);
  const closeTag = source.indexOf(">", index);
  if (openTag === -1 || closeTag === -1) {
    return null;
  }
  return source.slice(openTag, closeTag + 1);
}

export function isValidCanvasSurface(source: string): boolean {
  return (
    source.includes("bg-white") ||
    source.includes("bg-black") ||
    source.includes("bg-[#ffffff]") ||
    source.includes("bg-[#000000]")
  );
}

export function hasGhostPillStyling(snippet: string): boolean {
  return (
    snippet.includes("rounded-full") &&
    snippet.includes("border") &&
    snippet.includes("uppercase") &&
    !snippet.includes("bg-foreground")
  );
}

export function validateLandingDesign(
  source: string,
  designDocExists: boolean,
): DesignValidationResult {
  const reasons: string[] = [];

  if (!designDocExists) {
    reasons.push("DESIGN.md is missing from repository root");
  }

  if (!isValidCanvasSurface(source)) {
    reasons.push(
      "missing DESIGN.md canvas surface (must use bg-white for light theme or bg-black for dark theme)",
    );
  }

  const foundAccents = FORBIDDEN_MARKETING_ACCENT_CLASSES.filter((cls) =>
    source.includes(cls),
  );
  if (foundAccents.length > 0) {
    reasons.push(
      `violates monochrome palette with accent classes: ${foundAccents.join(", ")}`,
    );
  }

  const ctaSnippet = extractElementSnippet(source, "start-practice") ?? "";
  if (!hasGhostPillStyling(ctaSnippet)) {
    reasons.push(
      "start-practice CTA violates ghost-pill button spec (must have border, rounded-full, uppercase, and non-filled background)",
    );
  }

  const titleSnippet = extractElementSnippet(source, "hero-title") ?? "";
  const badgeSnippet = extractElementSnippet(source, "app-badge") ?? "";
  const hasUppercaseDisplay =
    titleSnippet.includes("uppercase") && badgeSnippet.includes("uppercase");
  if (!hasUppercaseDisplay) {
    reasons.push(
      "hero-title and app-badge must use uppercase typography per DESIGN.md",
    );
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
