import fs from "node:fs";
import path from "node:path";
import { type Proof } from "./contracts";
import { type EvalFixture } from "./fixtures";
import { type EvaluationResult } from "./engine";
import { type ReviewReport } from "./review";

export interface CaseTrace {
  id: string;
  suite: "golden" | "holdout" | "canary";
  input: EvalFixture["input"];
  expected: EvalFixture["expected"];
  stubMustMiss: boolean;
  decision: string;
  dimension: string | null;
  finalDecision: string;
  isCapped: boolean;
  pass: boolean;
}

export interface EvalTrace {
  timestamp: string;
  layer0: Record<string, boolean>;
  layer1: {
    passedGoldens: number;
    totalGoldens: number;
    holdoutsPassed: number;
    totalHoldouts: number;
    canariesPassed: number;
    totalCanaries: number;
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
    id: "ACC-L0-SCHEMA",
    layer: 0,
    description:
      "Deterministic contract: FOLLOW_UP requires followUp and dimension; invalid payloads are rejected",
  },
  {
    id: "ACC-L0-GROUNDING",
    layer: 0,
    description:
      "Deterministic contract: Feedback quotes must be transcript substrings; fabricated and empty quotes fail",
  },
  {
    id: "ACC-L0-STATE-CAP",
    layer: 0,
    description:
      "State machine contract: Maximum 2 follow-ups per question before forced MOVE_ON",
  },
  {
    id: "ACC-L0-EMPTY-ANSWER",
    layer: 0,
    description:
      "Empty or whitespace answers fail closed to FOLLOW_UP / specificity",
  },
  {
    id: "ACC-L1-GOLDENS",
    layer: 1,
    description:
      "Golden transcripts: 100% pass on frozen failure-mode fixtures",
  },
  {
    id: "ACC-L1-HOLDOUTS",
    layer: 1,
    description: "Holdout fixtures pass without copying golden answers",
  },
  {
    id: "ACC-L1-CANARIES",
    layer: 1,
    description:
      "Canaries stay unsolved by the stub so a 100% suite cannot be faked",
  },
  {
    id: "ACC-L2-REVIEW",
    layer: 2,
    description:
      "Deterministic review: suite health, holdout independence, colocated tests for changed source",
  },
  {
    id: "ACC-UI-LANDING",
    layer: 0,
    description:
      "Landing page exposes badge, title, description, start-practice, and harness hint via data-testid",
  },
];

export function buildCaseTrace(
  suite: CaseTrace["suite"],
  fixture: EvalFixture,
  result: EvaluationResult,
  pass: boolean,
): CaseTrace {
  return {
    id: fixture.id,
    suite,
    input: fixture.input,
    expected: fixture.expected,
    stubMustMiss: fixture.stubMustMiss === true,
    decision: result.decision.decision,
    dimension: result.decision.dimension ?? null,
    finalDecision: result.finalDecision,
    isCapped: result.isCapped,
    pass,
  };
}

export function buildAcceptanceDocument(
  proofs: Record<string, Proof>,
): AcceptanceDocument {
  return {
    project: "Howdy Interview Coach",
    version: "1.0.0",
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
