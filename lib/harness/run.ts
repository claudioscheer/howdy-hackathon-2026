import path from "node:path";
import {
  type AnswerEvaluationInput,
  type AnswerEvaluator,
} from "../interview/contracts";
import { ScriptedAnswerEvaluator } from "../interview/evaluator";
import { inspectBehavior, sensitivityFailures } from "./behavior";
import {
  proveGroundingContract,
  proveLandingContract,
  proveSchemaContract,
  type Proof,
} from "./contracts";
import { runScenario, type ScenarioRun } from "./engine";
import { type EvalScenario, loadScenariosFromDir } from "./fixtures";
import { proveLoginContract } from "./login-contract";
import {
  buildCaseTrace,
  countSuite,
  type CaseTrace,
  type EvalTrace,
  persistHarnessOutputs,
} from "./report";
import { reviewHarness } from "./review";
import { proveRuntimeContractSet } from "./runtime-contract-proof";
import { runSensitivityChecks } from "./sensitivity";

class MalformedEvaluator implements AnswerEvaluator {
  async evaluate(_input: AnswerEvaluationInput): Promise<unknown> {
    return { decision: "FOLLOW_UP", reason: "Missing required fields." };
  }
}

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
  goldens: EvalScenario[];
  holdouts: EvalScenario[];
  failures: string[];
} {
  const failures: string[] = [];
  const load = (kind: string): EvalScenario[] => {
    try {
      return loadScenariosFromDir(path.join(rootDir, "evals", kind));
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

function evaluatorFor(scenario: EvalScenario): AnswerEvaluator {
  return scenario.evaluator === "MALFORMED"
    ? new MalformedEvaluator()
    : new ScriptedAnswerEvaluator();
}

export async function evaluateSuite(
  suite: "golden" | "holdout",
  scenarios: EvalScenario[],
): Promise<{ cases: CaseTrace[]; failures: string[] }> {
  const cases: CaseTrace[] = [];
  const failures: string[] = [];
  for (const scenario of scenarios) {
    const result = await runScenario(scenario, evaluatorFor(scenario));
    cases.push(buildCaseTrace(suite, result));
    if (!result.pass) {
      failures.push(scenarioFailure(suite, result));
    }
  }
  return { cases, failures };
}

export function scenarioFailure(suite: string, run: ScenarioRun): string {
  return `${suite} [${run.scenario.id}] did not match expected product runtime transitions: ${JSON.stringify(run.steps)}`;
}

export function buildLayer0Proofs(rootDir: string): Record<string, Proof> {
  return {
    "ACC-L0-SCHEMA": proveSchemaContract(),
    "ACC-L0-GROUNDING": proveGroundingContract(),
    "ACC-L0-RUNTIME-CONTRACTS": proveRuntimeContractSet(),
    "ACC-UI-LANDING": proveLandingContract(rootDir),
    "ACC-UI-LOGIN": proveLoginContract(rootDir),
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
  const goldenRun = await evaluateSuite("golden", suites.goldens);
  const holdoutRun = await evaluateSuite("holdout", suites.holdouts);
  failures.push(...goldenRun.failures, ...holdoutRun.failures);

  const cases = [...goldenRun.cases, ...holdoutRun.cases];
  const goldens = countSuite(cases, "golden");
  const holdouts = countSuite(cases, "holdout");
  const behavior = inspectBehavior(cases);
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

  const suitesPass =
    goldens.total > 0 &&
    goldens.passed === goldens.total &&
    holdouts.total > 0 &&
    holdouts.passed === holdouts.total;
  const sensitivityPass =
    sensitivity.alwaysMoveOnRejected && sensitivity.alwaysFollowUpRejected;
  const adaptiveRuntimePass =
    suitesPass && sensitivityPass && Object.values(behavior).every(Boolean);
  const runtimeContractsPass = Object.entries(layer0).every(
    ([id, proof]) => id === "ACC-UI-LANDING" || proof.pass,
  );
  const proofs: Record<string, Proof> = {
    "ACC-RUNTIME-CONTRACTS": {
      pass: runtimeContractsPass,
      evidence:
        "lib/interview contracts plus Layer 0 positive and negative proofs",
    },
    "ACC-PRODUCT-ADAPTIVE-INTERVIEW": {
      pass: adaptiveRuntimePass,
      evidence:
        "evals/traces/latest-eval.json#layer1 real lib/interview multi-turn transitions",
    },
    "ACC-HARNESS-BEHAVIOR": {
      pass: suitesPass && sensitivityPass,
      evidence: "evals/traces/latest-eval.json#layer1 and #sensitivity",
    },
    "ACC-HARNESS-REVIEW": {
      pass: review.findings.length === 0,
      evidence: "evals/traces/latest-eval.json#review",
    },
  };

  const trace: EvalTrace = {
    timestamp: (options.now?.() ?? new Date()).toISOString(),
    runtime: "lib/interview",
    layer0: Object.fromEntries(
      Object.entries(layer0).map(([id, proof]) => [id, proof.pass]),
    ),
    layer1: {
      passedGoldens: goldens.passed,
      totalGoldens: goldens.total,
      holdoutsPassed: holdouts.passed,
      totalHoldouts: holdouts.total,
      ...behavior,
    },
    sensitivity,
    review,
    cases,
    failures,
  };

  persistHarnessOutputs(options.rootDir, trace, proofs);
  return { ok: failures.length === 0, failures, trace, proofs };
}
