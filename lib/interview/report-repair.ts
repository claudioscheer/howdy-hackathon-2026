const DIMENSIONS = [
  "relevance",
  "specificity",
  "fundamentals",
  "structure",
] as const;

type CandidateTurn = {
  questionId: string;
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function candidateTurns(transcript: unknown): CandidateTurn[] {
  if (!Array.isArray(transcript)) {
    return [];
  }
  return transcript.flatMap((turn) => {
    if (!isRecord(turn) || turn.speaker !== "candidate") {
      return [];
    }
    if (
      typeof turn.questionId !== "string" ||
      typeof turn.content !== "string"
    ) {
      return [];
    }
    return [{ questionId: turn.questionId, content: turn.content }];
  });
}

function poolFor(questionId: string, turns: CandidateTurn[]): CandidateTurn[] {
  const matching = turns.filter((turn) => turn.questionId === questionId);
  if (matching.length > 0) {
    return matching;
  }
  return turns;
}

function groundedEvidenceItem(item: unknown, turns: CandidateTurn[]): unknown {
  if (!isRecord(item)) {
    return item;
  }
  const questionId = typeof item.questionId === "string" ? item.questionId : "";
  const quote = typeof item.quote === "string" ? item.quote : "";
  const pool = poolFor(questionId, turns);
  const owner = pool.find((turn) => turn.content.includes(quote));
  if (quote.trim().length > 0 && owner !== undefined) {
    return { ...item, questionId: owner.questionId, quote };
  }
  const lead = pool[0];
  if (lead === undefined) {
    return { ...item, questionId, quote };
  }
  const grounded =
    lead.content.trim().length > 0 ? lead.content.trim() : lead.content;
  return { ...item, questionId: lead.questionId, quote: grounded };
}

function repairDimension(dimension: unknown, turns: CandidateTurn[]): unknown {
  if (!isRecord(dimension)) {
    return dimension;
  }
  const next: Record<string, unknown> = { ...dimension };
  if (Array.isArray(dimension.evidence)) {
    next.evidence = dimension.evidence.map((item) =>
      groundedEvidenceItem(item, turns),
    );
  }
  if (
    dimension.status === "insufficient_evidence" &&
    (typeof dimension.remainingUnknown !== "string" ||
      dimension.remainingUnknown.trim().length === 0)
  ) {
    next.remainingUnknown =
      "The session did not gather enough signal for this dimension.";
  }
  return next;
}

export function repairSessionReport(
  raw: unknown,
  transcript: unknown,
): unknown {
  if (!isRecord(raw) || !isRecord(raw.dimensions)) {
    return raw;
  }
  const turns = candidateTurns(transcript);
  const dimensions: Record<string, unknown> = { ...raw.dimensions };
  for (const key of DIMENSIONS) {
    dimensions[key] = repairDimension(dimensions[key], turns);
  }
  return { ...raw, dimensions };
}
