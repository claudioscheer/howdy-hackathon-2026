import fs from "node:fs";
import path from "node:path";
import { type ScenarioRun } from "./engine";
import { type Proof } from "./contracts";
import { type ReviewReport } from "./review";

export interface CaseTrace {
  id: string;
  suite: "golden" | "holdout";
  description: string;
  evaluator: "SCRIPTED" | "MALFORMED";
  steps: ScenarioRun["steps"];
  pass: boolean;
}

export interface EvalTrace {
  timestamp: string;
  runtime: "lib/interview";
  layer0: Record<string, boolean>;
  layer1: {
    passedGoldens: number;
    totalGoldens: number;
    holdoutsPassed: number;
    totalHoldouts: number;
    adaptivePath: boolean;
    secondFollowUp: boolean;
    deterministicCap: boolean;
    malformedOutputSafe: boolean;
  };
  sensitivity: {
    alwaysMoveOnRejected: boolean;
    alwaysFollowUpRejected: boolean;
  };
  review: ReviewReport;
  cases: CaseTrace[];
  failures: string[];
}

export interface AcceptanceCriterion {
  id: string;
  layer: number;
  description: string;
  passes: boolean;
  evidence: string;
}

export interface AcceptanceDocument {
  project: string;
  version: string;
  criteria: AcceptanceCriterion[];
}

export const ACCEPTANCE_SPECS: Array<
  Omit<AcceptanceCriterion, "passes" | "evidence">
> = [
  {
    id: "ACC-RUNTIME-CONTRACTS",
    layer: 0,
    description:
      "Runtime planner, evaluator, report, session state, and event contracts are schema-validated",
  },
  {
    id: "ACC-PRODUCT-SESSION-CONFIG",
    layer: 1,
    description:
      "A fictional candidate and opportunity can be configured and opened as a practice session",
  },
  {
    id: "ACC-PRODUCT-ADAPTIVE-INTERVIEW",
    layer: 1,
    description:
      "A typed answer drives a deterministic FOLLOW_UP or MOVE_ON transition in the product",
  },
  {
    id: "ACC-PRODUCT-GROUNDED-REPORT",
    layer: 1,
    description:
      "A completed interview produces all four scores with transcript-grounded feedback",
  },
  {
    id: "ACC-PRODUCT-RETRY-COMPARISON",
    layer: 1,
    description:
      "A retry varies questions and compares the attempt with the previous report",
  },
  {
    id: "ACC-HARNESS-BEHAVIOR",
    layer: 2,
    description:
      "Golden and independent holdout behavior passes, while trivial constant-decision mutations fail",
  },
  {
    id: "ACC-HARNESS-REVIEW",
    layer: 2,
    description:
      "Deterministic review checks suite independence and changed source files locally and in CI",
  },
];

export function buildCaseTrace(
  suite: CaseTrace["suite"],
  run: ScenarioRun,
): CaseTrace {
  return {
    id: run.scenario.id,
    suite,
    description: run.scenario.description,
    evaluator: run.scenario.evaluator,
    steps: run.steps,
    pass: run.pass,
  };
}

export function buildAcceptanceDocument(
  proofs: Record<string, Proof>,
): AcceptanceDocument {
  return {
    project: "Howdy Interview Coach",
    version: "0.1.0",
    criteria: ACCEPTANCE_SPECS.map((spec) => {
      const proof = proofs[spec.id];
      return {
        ...spec,
        passes: proof?.pass ?? false,
        evidence: proof?.evidence ?? "not proven this run",
      };
    }),
  };
}

export function persistHarnessOutputs(
  rootDir: string,
  trace: EvalTrace,
  proofs: Record<string, Proof>,
): void {
  const traceDir = path.join(rootDir, "evals/traces");
  fs.mkdirSync(traceDir, { recursive: true });
  fs.writeFileSync(
    path.join(traceDir, "latest-eval.json"),
    `${JSON.stringify(trace, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(rootDir, "acceptance.json"),
    `${JSON.stringify(buildAcceptanceDocument(proofs), null, 2)}\n`,
  );
}

export function countSuite(
  cases: CaseTrace[],
  suite: CaseTrace["suite"],
): { passed: number; total: number } {
  const subset = cases.filter((item) => item.suite === suite);
  return {
    passed: subset.filter((item) => item.pass).length,
    total: subset.length,
  };
}
