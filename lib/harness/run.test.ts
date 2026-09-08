import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inspectBehavior } from "./behavior";
import { EvalScenarioSchema } from "./fixtures";
import {
  buildLayer0Proofs,
  collectFailedProofs,
  errorMessage,
  evaluateSuite,
  loadSuites,
  runHarness,
  scenarioFailure,
} from "./run";

const repoRoot = path.resolve(import.meta.dirname, "../..");

describe("harness runner", () => {
  it("loads suites and records invalid JSON", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "suites-"));
    fs.mkdirSync(path.join(root, "evals/goldens"), { recursive: true });
    fs.writeFileSync(path.join(root, "evals/goldens/bad.json"), "{");
    expect(loadSuites(root).failures[0]).toMatch(/Failed to load/);
  });

  it("formats errors and failed proofs", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage("nope")).toBe("unknown error");
    expect(
      collectFailedProofs({
        good: { pass: true, evidence: "yes" },
        bad: { pass: false, evidence: "no" },
      }),
    ).toEqual(["bad failed: no"]);
  });

  it("records a mismatched scenario failure", async () => {
    const mismatch = EvalScenarioSchema.parse({
      id: "mismatch",
      description: "Impossible expected transition.",
      steps: [
        {
          answer: "I led a TypeScript migration that cut errors by 30 percent.",
          expected: {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            questionIndex: 0,
            followUpCount: 1,
            historyLength: 3,
            status: "AWAITING_ANSWER",
          },
        },
      ],
    });
    const result = await evaluateSuite("golden", [mismatch]);
    expect(result.cases[0]?.pass).toBe(false);
    expect(result.failures[0]).toMatch(/mismatch/);
    expect(
      scenarioFailure("golden", {
        scenario: mismatch,
        steps: [],
        pass: false,
      }),
    ).toMatch(/transitions/);
  });

  it("detects each runtime behavior only in passed traces", () => {
    const behavior = inspectBehavior([
      {
        id: "all",
        suite: "golden",
        description: "all",
        evaluator: "SCRIPTED",
        pass: true,
        steps: [
          {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            dimension: "specificity",
            questionIndex: 0,
            followUpCount: 1,
            historyLength: 3,
            status: "AWAITING_ANSWER",
            stateUnchanged: false,
          },
          {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            dimension: "specificity",
            questionIndex: 0,
            followUpCount: 2,
            historyLength: 5,
            status: "AWAITING_ANSWER",
            stateUnchanged: false,
          },
          {
            outcome: "APPLIED",
            recommendedDecision: "FOLLOW_UP",
            dimension: "specificity",
            questionIndex: 1,
            followUpCount: 0,
            historyLength: 7,
            status: "AWAITING_ANSWER",
            stateUnchanged: false,
          },
          {
            outcome: "APPLIED",
            recommendedDecision: "MOVE_ON",
            questionIndex: 1,
            followUpCount: 0,
            historyLength: 5,
            status: "AWAITING_ANSWER",
            stateUnchanged: false,
          },
          {
            outcome: "REJECTED",
            questionIndex: 0,
            followUpCount: 0,
            historyLength: 1,
            status: "AWAITING_ANSWER",
            stateUnchanged: true,
          },
        ],
      },
    ]);
    expect(Object.values(behavior).every(Boolean)).toBe(true);
    expect(inspectBehavior([]).adaptivePath).toBe(false);
  });

  it("runs the real repository harness and keeps deferred criteria false", async () => {
    expect(buildLayer0Proofs(repoRoot)["ACC-L0-RUNTIME-CONTRACTS"]?.pass).toBe(
      true,
    );
    const result = await runHarness({
      rootDir: repoRoot,
      changedFiles: [],
      now: () => new Date("2026-09-07T00:00:00.000Z"),
    });
    expect(result.ok).toBe(true);
    expect(result.trace.runtime).toBe("lib/interview");
    expect(result.trace.layer1).toMatchObject({
      passedGoldens: 3,
      totalGoldens: 3,
      holdoutsPassed: 1,
      totalHoldouts: 1,
      adaptivePath: true,
      secondFollowUp: true,
      deterministicCap: true,
      malformedOutputSafe: true,
    });
    expect(result.proofs["ACC-PRODUCT-ADAPTIVE-INTERVIEW"]?.pass).toBe(true);
  });

  it("fails when suites are absent and uses the system clock", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "missing-suites-"));
    const result = await runHarness({ rootDir: root, changedFiles: [] });
    expect(result.ok).toBe(false);
    expect(result.trace.timestamp).toMatch(/^\d{4}-/);
  });
});
