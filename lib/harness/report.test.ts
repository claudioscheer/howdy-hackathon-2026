import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type EvalFixture, EvalFixtureSchema } from "./fixtures";
import {
  ACCEPTANCE_SPECS,
  buildAcceptanceDocument,
  buildCaseTrace,
  countSuite,
  persistHarnessOutputs,
} from "./report";

const fixture: EvalFixture = EvalFixtureSchema.parse({
  id: "sample",
  description: "Report fixture",
  input: {
    role: "Engineer",
    seniority: "Senior",
    targetTechStack: ["Go"],
    question: "Tell me about a recent project.",
    answer: "We cut p99 from 800ms to 80ms.",
  },
  expected: { decision: "MOVE_ON" },
});

describe("buildCaseTrace", () => {
  it("records a null dimension when the decision has none", () => {
    const trace = buildCaseTrace(
      "golden",
      fixture,
      {
        decision: { decision: "MOVE_ON", reason: "Concrete enough." },
        finalDecision: "MOVE_ON",
        isCapped: false,
      },
      true,
    );
    expect(trace.dimension).toBeNull();
    expect(trace.stubMustMiss).toBe(false);
    expect(trace.pass).toBe(true);
  });
});

describe("acceptance document", () => {
  it("defaults unproven criteria to false", () => {
    const doc = buildAcceptanceDocument({
      "ACC-L0-SCHEMA": { pass: true, evidence: "schema" },
    });
    expect(doc.project).toBe("Howdy Interview Coach");
    expect(doc.criteria).toHaveLength(ACCEPTANCE_SPECS.length);
    expect(doc.criteria[0]?.passes).toBe(true);
    expect(doc.criteria.some((item) => item.passes === false)).toBe(true);
    expect(
      doc.criteria.find((item) => item.id === "ACC-L2-REVIEW")?.evidence,
    ).toBe("not proven this run");
  });
});

describe("persistHarnessOutputs", () => {
  it("writes trace and acceptance files", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "report-"));
    persistHarnessOutputs(
      root,
      {
        timestamp: "2026-09-03T00:00:00.000Z",
        layer0: { schema: true },
        layer1: {
          passedGoldens: 1,
          totalGoldens: 1,
          holdoutsPassed: 0,
          totalHoldouts: 0,
          canariesPassed: 0,
          totalCanaries: 0,
        },
        review: { findings: [], changedFiles: [], mappedCriteria: [] },
        cases: [],
        failures: [],
      },
      { "ACC-L0-SCHEMA": { pass: true, evidence: "schema" } },
    );
    expect(
      fs.existsSync(path.join(root, "evals/traces/latest-eval.json")),
    ).toBe(true);
    expect(fs.existsSync(path.join(root, "acceptance.json"))).toBe(true);
  });
});

describe("countSuite", () => {
  it("counts passes per suite", () => {
    const cases = [
      buildCaseTrace(
        "golden",
        fixture,
        {
          decision: { decision: "MOVE_ON", reason: "Concrete enough." },
          finalDecision: "MOVE_ON",
          isCapped: false,
        },
        true,
      ),
      buildCaseTrace(
        "holdout",
        fixture,
        {
          decision: {
            decision: "FOLLOW_UP",
            reason: "Too vague here.",
            dimension: "specificity",
            followUp: "Give one example.",
          },
          finalDecision: "FOLLOW_UP",
          isCapped: false,
        },
        false,
      ),
    ];
    expect(countSuite(cases, "golden")).toEqual({ passed: 1, total: 1 });
    expect(countSuite(cases, "holdout")).toEqual({ passed: 0, total: 1 });
    expect(countSuite(cases, "canary")).toEqual({ passed: 0, total: 0 });
  });
});
