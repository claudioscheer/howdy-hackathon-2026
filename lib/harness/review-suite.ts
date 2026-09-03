import { type EvalFixture } from "./fixtures";
import { type RubricDimension } from "./schema";
import { jaccardSimilarity, significantTokens } from "./tokens";

export const MAX_HOLDOUT_JACCARD = 0.4;

const RUBRIC_DIMENSIONS: RubricDimension[] = [
  "relevance",
  "specificity",
  "fundamentals",
  "structure",
];

export function duplicateIdFailures(suites: EvalFixture[][]): string[] {
  const seen = new Map<string, number>();
  for (const suite of suites) {
    for (const fixture of suite) {
      seen.set(fixture.id, (seen.get(fixture.id) ?? 0) + 1);
    }
  }
  const failures: string[] = [];
  for (const [id, count] of seen.entries()) {
    if (count > 1) {
      failures.push(`Duplicate fixture id [${id}] appears ${count} times`);
    }
  }
  return failures;
}

export function answerSimilarityFailure(
  left: EvalFixture,
  right: EvalFixture,
  maxJaccard: number,
): string | null {
  const leftAnswer = left.input.answer.toLowerCase();
  const rightAnswer = right.input.answer.toLowerCase();
  if (leftAnswer.length > 0 && rightAnswer.includes(leftAnswer)) {
    return `[${right.id}] contains the answer from [${left.id}]`;
  }
  if (rightAnswer.length > 0 && leftAnswer.includes(rightAnswer)) {
    return `[${left.id}] contains the answer from [${right.id}]`;
  }
  const score = jaccardSimilarity(
    significantTokens(left.input.answer),
    significantTokens(right.input.answer),
  );
  if (score > maxJaccard) {
    return `[${left.id}] too similar to [${right.id}] (jaccard ${score.toFixed(2)})`;
  }
  return null;
}

export function independenceFailures(
  references: EvalFixture[],
  candidates: EvalFixture[],
  label: string,
  maxJaccard = MAX_HOLDOUT_JACCARD,
): string[] {
  const failures: string[] = [];
  for (const candidate of candidates) {
    for (const reference of references) {
      const failure = answerSimilarityFailure(reference, candidate, maxJaccard);
      if (failure) {
        failures.push(`${label} ${failure}`);
      }
    }
  }
  return failures;
}

export function dimensionCoverageFailures(goldens: EvalFixture[]): string[] {
  const present = new Set(
    goldens
      .map((fixture) => fixture.expected.dimension)
      .filter(
        (dimension): dimension is RubricDimension => dimension !== undefined,
      ),
  );
  const missing = RUBRIC_DIMENSIONS.filter(
    (dimension) => !present.has(dimension),
  );
  const hasMoveOn = goldens.some(
    (fixture) =>
      fixture.expected.decision === "MOVE_ON" ||
      fixture.expected.finalDecision === "MOVE_ON",
  );
  const hasCap = goldens.some((fixture) => fixture.expected.isCapped === true);
  const failures: string[] = [];
  if (missing.length > 0) {
    failures.push(`Goldens missing rubric dimensions: ${missing.join(", ")}`);
  }
  if (!hasMoveOn) {
    failures.push("Goldens missing a MOVE_ON case");
  }
  if (!hasCap) {
    failures.push("Goldens missing a follow-up cap case");
  }
  return failures;
}

export function reviewEvalSuite(input: {
  goldens: EvalFixture[];
  holdouts: EvalFixture[];
}): string[] {
  return [
    ...duplicateIdFailures([input.goldens, input.holdouts]),
    ...dimensionCoverageFailures(input.goldens),
    ...independenceFailures(input.goldens, input.holdouts, "Holdout"),
  ];
}
