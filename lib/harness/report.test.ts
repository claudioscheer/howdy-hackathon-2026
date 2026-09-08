import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EvalScenarioSchema } from "./fixtures";
import {
  ACCEPTANCE_SPECS,
  buildAcceptanceDocument,
  buildCaseTrace,
  countSuite,
  persistHarnessOutputs,
  type EvalTrace,
} from "./report";

const scenario = EvalScenarioSchema.parse({
  id: "sample",
  description: "Sample trace.",
  steps: [
    {
      answer: "An answer.",
      expected: {
        outcome: "APPLIED",
        questionIndex: 1,
        followUpCount: 0,
        historyLength: 3,
        status: "AWAITING_ANSWER",
      },
    },
  ],
});

const caseTrace = buildCaseTrace("golden", {
  scenario,
  steps: [
    {
      outcome: "APPLIED",
      questionIndex: 1,
      followUpCount: 0,
      historyLength: 3,
      status: "AWAITING_ANSWER",
      stateUnchanged: false,
    },
  ],
  pass: true,
});

describe("harness report", () => {
  it("builds traces and suite counts", () => {
    expect(caseTrace.id).toBe("sample");
    expect(countSuite([caseTrace], "golden")).toEqual({ passed: 1, total: 1 });
    expect(countSuite([caseTrace], "holdout")).toEqual({ passed: 0, total: 0 });
  });

  it("defaults unproven acceptance criteria to false", () => {
    const document = buildAcceptanceDocument({
      "ACC-RUNTIME-CONTRACTS": { pass: true, evidence: "contracts" },
    });
    expect(document.criteria).toHaveLength(ACCEPTANCE_SPECS.length);
    expect(document.criteria[0]?.passes).toBe(true);
    expect(document.criteria[1]?.passes).toBe(false);
  });

  it("persists generated trace and acceptance evidence", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-report-"));
    const trace: EvalTrace = {
      timestamp: "2026-09-07T00:00:00.000Z",
      runtime: "lib/interview",
      layer0: { schema: true },
      layer1: {
        passedGoldens: 1,
        totalGoldens: 1,
        holdoutsPassed: 0,
        totalHoldouts: 0,
        adaptivePath: true,
        secondFollowUp: true,
        deterministicCap: true,
        malformedOutputSafe: true,
      },
      sensitivity: {
        alwaysMoveOnRejected: true,
        alwaysFollowUpRejected: true,
      },
      review: { findings: [], changedFiles: [], mappedCriteria: [] },
      cases: [caseTrace],
      failures: [],
    };
    persistHarnessOutputs(root, trace, {
      "ACC-PRODUCT-ADAPTIVE-INTERVIEW": {
        pass: true,
        evidence: "runtime trace",
      },
    });
    expect(
      fs.existsSync(path.join(root, "evals/traces/latest-eval.json")),
    ).toBe(true);
    expect(
      JSON.parse(
        fs.readFileSync(path.join(root, "acceptance.json"), "utf8"),
      ).criteria.find(
        (item: { id: string }) => item.id === "ACC-PRODUCT-ADAPTIVE-INTERVIEW",
      ).passes,
    ).toBe(true);
  });
});
