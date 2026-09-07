import { type EvalScenario } from "./fixtures";
import { jaccardSimilarity, significantTokens } from "./tokens";

export const MAX_HOLDOUT_JACCARD = 0.4;

function answers(scenario: EvalScenario): string[] {
  return scenario.steps.map((step) => step.answer);
}

export function duplicateIdFailures(suites: EvalScenario[][]): string[] {
  const seen = new Map<string, number>();
  for (const suite of suites) {
    for (const scenario of suite) {
      seen.set(scenario.id, (seen.get(scenario.id) ?? 0) + 1);
    }
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(
      ([id, count]) => `Duplicate scenario id [${id}] appears ${count} times`,
    );
}

export function answerSimilarityFailure(
  left: EvalScenario,
  right: EvalScenario,
  maxJaccard: number,
): string | null {
  for (const leftAnswer of answers(left)) {
    for (const rightAnswer of answers(right)) {
      const leftText = leftAnswer.toLowerCase();
      const rightText = rightAnswer.toLowerCase();
      if (leftText.length > 0 && rightText.includes(leftText)) {
        return `[${right.id}] contains an answer from [${left.id}]`;
      }
      if (rightText.length > 0 && leftText.includes(rightText)) {
        return `[${left.id}] contains an answer from [${right.id}]`;
      }
      const score = jaccardSimilarity(
        significantTokens(leftAnswer),
        significantTokens(rightAnswer),
      );
      if (score > maxJaccard) {
        return `[${left.id}] too similar to [${right.id}] (jaccard ${score.toFixed(2)})`;
      }
    }
  }
  return null;
}

export function independenceFailures(
  references: EvalScenario[],
  candidates: EvalScenario[],
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

export function behaviorCoverageFailures(goldens: EvalScenario[]): string[] {
  const expectedSteps = goldens.flatMap((scenario) => scenario.steps);
  const hasFollowUp = expectedSteps.some(
    (step) => step.expected.recommendedDecision === "FOLLOW_UP",
  );
  const hasMoveOn = expectedSteps.some(
    (step) => step.expected.recommendedDecision === "MOVE_ON",
  );
  const hasSecondFollowUp = expectedSteps.some(
    (step) => step.expected.followUpCount === 2,
  );
  const hasCap = expectedSteps.some(
    (step) =>
      step.expected.recommendedDecision === "FOLLOW_UP" &&
      step.expected.questionIndex > 0,
  );
  const hasMalformed = goldens.some(
    (scenario) => scenario.evaluator === "MALFORMED",
  );
  const missing = [
    [hasFollowUp, "FOLLOW_UP"],
    [hasMoveOn, "MOVE_ON"],
    [hasSecondFollowUp, "a second follow-up"],
    [hasCap, "the deterministic follow-up cap"],
    [hasMalformed, "malformed evaluator output"],
  ]
    .filter(([present]) => !present)
    .map(([, label]) => label);
  return missing.length === 0
    ? []
    : [`Goldens missing coverage for ${missing.join(", ")}`];
}

export function reviewEvalSuite(input: {
  goldens: EvalScenario[];
  holdouts: EvalScenario[];
}): string[] {
  return [
    ...duplicateIdFailures([input.goldens, input.holdouts]),
    ...behaviorCoverageFailures(input.goldens),
    ...independenceFailures(input.goldens, input.holdouts, "Holdout"),
  ];
}
