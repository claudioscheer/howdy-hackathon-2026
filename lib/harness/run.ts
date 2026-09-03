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
import { proveRuntimeContractSet } from "./runtime-contract-proof";
import { runSensitivityChecks, type SensitivityResult } from "./sensitivity";

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
    failures,
  };
}

export async function evaluateSuite(
  suite: "golden" | "holdout",
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
        `${suite} [${fixture.id}] expected ${JSON.stringify(fixture.expected)} got decision=${result.decision.decision} dimension=${result.decision.decision === "FOLLOW_UP" ? result.decision.dimension : ""} final=${result.finalDecision}`,
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
    "ACC-L0-RUNTIME-CONTRACTS": proveRuntimeContractSet(),
    "ACC-UI-LANDING": proveLandingContract(rootDir),
  };
}

export function collectFailedProofs(proofs: Record<string, Proof>): string[] {
  return Object.entries(proofs)
    .filter(([, proof]) => !proof.pass)
    .map(([id, proof]) => `${id} failed: ${proof.evidence}`);
}

function sensitivityFailures(sensitivity: SensitivityResult): string[] {
  const failures: string[] = [];
  if (!sensitivity.alwaysMoveOnRejected) {
    failures.push(
      "Behavioral suite did not reject the always-MOVE_ON mutation",
    );
  }
  if (!sensitivity.alwaysFollowUpRejected) {
    failures.push(
      "Behavioral suite did not reject the always-FOLLOW_UP mutation",
    );
  }
  return failures;
}

function behaviorPasses(
  goldens: { passed: number; total: number },
  holdouts: { passed: number; total: number },
  sensitivity: SensitivityResult,
): boolean {
  return (
    goldens.total > 0 &&
    goldens.passed === goldens.total &&
    holdouts.total > 0 &&
    holdouts.passed === holdouts.total &&
    sensitivity.alwaysMoveOnRejected &&
    sensitivity.alwaysFollowUpRejected
  );
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
  failures.push(...goldenRun.failures, ...holdoutRun.failures);

  const cases = [...goldenRun.cases, ...holdoutRun.cases];
  const goldens = countSuite(cases, "golden");
  const holdouts = countSuite(cases, "holdout");
  const sensitivity = await runSensitivityChecks([
    ...suites.goldens,
    ...suites.holdouts,
  ]);
  failures.push(...sensitivityFailures(sensitivity));

  const review = reviewHarness({
    goldens: suites.goldens,
    holdouts: suites.holdouts,
    rootDir: options.rootDir,
    changedFiles: options.changedFiles,
  });
  failures.push(...review.findings);

  const behaviorIsProven = behaviorPasses(goldens, holdouts, sensitivity);
  const runtimeContractsPass = Object.entries(layer0).every(
    ([id, proof]) => id === "ACC-UI-LANDING" || proof.pass,
  );
  const proofs: Record<string, Proof> = {
    "ACC-RUNTIME-CONTRACTS": {
      pass: runtimeContractsPass,
      evidence:
        "lib/interview contracts plus Layer 0 positive and negative proofs",
    },
    "ACC-HARNESS-BEHAVIOR": {
      pass: behaviorIsProven,
      evidence: "evals/traces/latest-eval.json#layer1 and #sensitivity",
    },
    "ACC-HARNESS-REVIEW": {
      pass: review.findings.length === 0,
      evidence: "evals/traces/latest-eval.json#review",
    },
  };

  const trace: EvalTrace = {
    timestamp: (options.now?.() ?? new Date()).toISOString(),
    layer0: {
      schema: layer0["ACC-L0-SCHEMA"].pass,
      grounding: layer0["ACC-L0-GROUNDING"].pass,
      stateCap: layer0["ACC-L0-STATE-CAP"].pass,
      emptyAnswer: layer0["ACC-L0-EMPTY-ANSWER"].pass,
      runtimeContracts: layer0["ACC-L0-RUNTIME-CONTRACTS"].pass,
      landing: layer0["ACC-UI-LANDING"].pass,
    },
    layer1: {
      passedGoldens: goldens.passed,
      totalGoldens: goldens.total,
      holdoutsPassed: holdouts.passed,
      totalHoldouts: holdouts.total,
    },
    sensitivity,
    review,
    cases,
    failures,
  };

  persistHarnessOutputs(options.rootDir, trace, proofs);
  return { ok: failures.length === 0, failures, trace, proofs };
}
