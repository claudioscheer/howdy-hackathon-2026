import path from "node:path";
import {
  proveEmptyAnswerContract,
  proveGroundingContract,
  proveLandingContract,
  proveSchemaContract,
  proveStateCapContract,
  type Proof,
} from "./contracts";
import { DeterministicStubProvider, InterviewEngine } from "./engine";
import {
  type EvalFixture,
  fixtureState,
  loadFixturesFromDir,
  matchesExpected,
} from "./fixtures";
import {
  buildCaseTrace,
  countSuite,
  type EvalTrace,
  persistHarnessOutputs,
} from "./report";
import { reviewHarness } from "./review";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

export interface HarnessOptions {
  rootDir: string;
  changedFiles?: string[];
  now?: () => Date;
}

export interface HarnessResult {
  ok: boolean;
  failures: string[];
  trace: EvalTrace;
  proofs: Record<string, Proof>;
}

export function loadSuites(rootDir: string): {
  goldens: EvalFixture[];
  holdouts: EvalFixture[];
  canaries: EvalFixture[];
  failures: string[];
} {
  const failures: string[] = [];
  const load = (kind: string): EvalFixture[] => {
    try {
      return loadFixturesFromDir(path.join(rootDir, "evals", kind));
    } catch (error) {
      failures.push(`Failed to load evals/${kind}: ${errorMessage(error)}`);
      return [];
    }
  };
  return {
    goldens: load("goldens"),
    holdouts: load("holdouts"),
    canaries: load("canaries"),
    failures,
  };
}

export async function evaluateSuite(
  suite: "golden" | "holdout" | "canary",
  fixtures: EvalFixture[],
  engine: InterviewEngine,
): Promise<{ cases: ReturnType<typeof buildCaseTrace>[]; failures: string[] }> {
  const cases: ReturnType<typeof buildCaseTrace>[] = [];
  const failures: string[] = [];
  for (const fixture of fixtures) {
    const result = await engine.evaluateTurn(
      fixture.input,
      fixtureState(fixture),
    );
    const pass = matchesExpected(fixture, result);
    cases.push(buildCaseTrace(suite, fixture, result, pass));
    if (!pass) {
      failures.push(
        `${suite} [${fixture.id}] expected ${JSON.stringify(fixture.expected)} got decision=${result.decision.decision} dimension=${result.decision.dimension ?? ""} final=${result.finalDecision}`,
      );
    }
  }
  return { cases, failures };
}

export function buildLayer0Proofs(rootDir: string): Record<string, Proof> {
  return {
    "ACC-L0-SCHEMA": proveSchemaContract(),
    "ACC-L0-GROUNDING": proveGroundingContract(),
    "ACC-L0-STATE-CAP": proveStateCapContract(),
    "ACC-L0-EMPTY-ANSWER": proveEmptyAnswerContract(),
    "ACC-UI-LANDING": proveLandingContract(rootDir),
  };
}

export function collectFailedProofs(proofs: Record<string, Proof>): string[] {
  return Object.entries(proofs)
    .filter(([, proof]) => !proof.pass)
    .map(([id, proof]) => `${id} failed: ${proof.evidence}`);
}

export async function runHarness(
  options: HarnessOptions,
): Promise<HarnessResult> {
  const failures: string[] = [];
  const layer0 = buildLayer0Proofs(options.rootDir);
  failures.push(...collectFailedProofs(layer0));

  const suites = loadSuites(options.rootDir);
  failures.push(...suites.failures);

  const engine = new InterviewEngine(new DeterministicStubProvider());
  const goldenRun = await evaluateSuite("golden", suites.goldens, engine);
  const holdoutRun = await evaluateSuite("holdout", suites.holdouts, engine);
  const canaryRun = await evaluateSuite("canary", suites.canaries, engine);
  failures.push(
    ...goldenRun.failures,
    ...holdoutRun.failures,
    ...canaryRun.failures,
  );

  const cases = [...goldenRun.cases, ...holdoutRun.cases, ...canaryRun.cases];
  const goldens = countSuite(cases, "golden");
  const holdouts = countSuite(cases, "holdout");
  const canaries = countSuite(cases, "canary");

  const review = reviewHarness({
    goldens: suites.goldens,
    holdouts: suites.holdouts,
    canaries: suites.canaries,
    rootDir: options.rootDir,
    changedFiles: options.changedFiles,
  });
  failures.push(...review.findings);

  const proofs: Record<string, Proof> = {
    ...layer0,
    "ACC-L1-GOLDENS": {
      pass: goldens.total > 0 && goldens.passed === goldens.total,
      evidence: "evals/traces/latest-eval.json#layer1.passedGoldens",
    },
    "ACC-L1-HOLDOUTS": {
      pass: holdouts.total > 0 && holdouts.passed === holdouts.total,
      evidence: "evals/traces/latest-eval.json#layer1.holdoutsPassed",
    },
    "ACC-L1-CANARIES": {
      pass: canaries.total > 0 && canaries.passed === canaries.total,
      evidence: "evals/traces/latest-eval.json#layer1.canariesPassed",
    },
    "ACC-L2-REVIEW": {
      pass: review.findings.length === 0,
      evidence: "evals/traces/latest-eval.json#review",
    },
  };

  const trace: EvalTrace = {
    timestamp: (options.now?.() ?? new Date()).toISOString(),
    layer0: {
      schema: proofs["ACC-L0-SCHEMA"].pass,
      grounding: proofs["ACC-L0-GROUNDING"].pass,
      stateCap: proofs["ACC-L0-STATE-CAP"].pass,
      emptyAnswer: proofs["ACC-L0-EMPTY-ANSWER"].pass,
      landing: proofs["ACC-UI-LANDING"].pass,
    },
    layer1: {
      passedGoldens: goldens.passed,
      totalGoldens: goldens.total,
      holdoutsPassed: holdouts.passed,
      totalHoldouts: holdouts.total,
      canariesPassed: canaries.passed,
      totalCanaries: canaries.total,
    },
    review,
    cases,
    failures,
  };

  persistHarnessOutputs(options.rootDir, trace, proofs);
  return { ok: failures.length === 0, failures, trace, proofs };
}
