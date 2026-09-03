export function significantTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3),
  );
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return intersection / union;
}

export function overlapRatio(question: string, answer: string): number {
  const questionTokens = significantTokens(question);
  const answerTokens = significantTokens(answer);
  if (questionTokens.size === 0) {
    return 1;
  }
  let hit = 0;
  for (const token of questionTokens) {
    if (answerTokens.has(token)) {
      hit += 1;
    }
  }
  return hit / questionTokens.size;
}
