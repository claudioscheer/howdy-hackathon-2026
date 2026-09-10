import { InterviewerDecisionSchema } from "./contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function groundedQuote(quote: string, latestAnswer: string): string {
  if (latestAnswer.includes(quote) && quote.trim().length > 0) {
    return quote;
  }
  const trimmed = latestAnswer.trim();
  if (trimmed.length === 0) {
    return quote;
  }
  return trimmed.slice(0, Math.min(120, trimmed.length));
}

function repairEvidence(evidence: unknown, latestAnswer: string): unknown {
  if (!Array.isArray(evidence)) {
    return [
      {
        quote: groundedQuote("", latestAnswer),
        supports: "The quoted text is the candidate's latest answer.",
      },
    ];
  }
  return evidence.map((item) => {
    if (!isRecord(item)) {
      return item;
    }
    const quote =
      typeof item.quote === "string"
        ? groundedQuote(item.quote, latestAnswer)
        : groundedQuote("", latestAnswer);
    const supports =
      typeof item.supports === "string" && item.supports !== quote
        ? item.supports
        : "The quoted text is the candidate's latest answer.";
    return { ...item, quote, supports };
  });
}

export function repairInterviewerDecision(
  raw: unknown,
  latestAnswer: string,
): unknown {
  if (!isRecord(raw)) {
    return raw;
  }
  const repaired = {
    ...raw,
    evidence: repairEvidence(raw.evidence, latestAnswer),
  };
  const parsed = InterviewerDecisionSchema.safeParse(repaired);
  return parsed.success ? parsed.data : repaired;
}
