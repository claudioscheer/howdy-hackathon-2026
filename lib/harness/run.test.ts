import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { InterviewEngine } from "./engine";
import { EvalFixtureSchema } from "./fixtures";
import {
  buildLayer0Proofs,
  collectFailedProofs,
  errorMessage,
  evaluateSuite,
  loadSuites,
  runHarness,
} from "./run";

const repoRoot = path.resolve(import.meta.dirname, "../..");

describe("loadSuites", () => {
  it("records a load failure for invalid JSON", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "suites-"));
    fs.mkdirSync(path.join(root, "evals/goldens"), { recursive: true });
    fs.writeFileSync(path.join(root, "evals/goldens/bad.json"), "{");
    const loaded = loadSuites(root);
    expect(loaded.failures.length).toBeGreaterThan(0);
    expect(loaded.goldens).toEqual([]);
  });
});

describe("evaluateSuite", () => {
  it("records a failure when the expected decision does not match", async () => {
    const fixture = EvalFixtureSchema.parse({
      id: "mismatch",
      description: "Expects MOVE_ON on a vague answer",
      input: {
        role: "Engineer",
        seniority: "Senior",
        targetTechStack: ["Go"],
        question: "Tell me about a recent project.",
        answer: "I always communicate well with stakeholders.",
      },
      expected: { decision: "MOVE_ON" },
    });
    const result = await evaluateSuite(
      "golden",
      [fixture],
      new InterviewEngine({
        evaluate: async () => ({
          decision: "FOLLOW_UP",
          dimension: "specificity",
          followUp: "Give one example.",
          reason: "Too generic to move on.",
        }),
      }),
    );
    expect(result.failures).toHaveLength(1);
    expect(result.cases[0]?.pass).toBe(false);
  });

  it("omits dimension in the failure text when the decision has none", async () => {
    const fixture = EvalFixtureSchema.parse({
      id: "no-dimension",
      description: "Expects FOLLOW_UP, provider returns MOVE_ON",
      input: {
        role: "Engineer",
        seniority: "Senior",
        targetTechStack: ["Go"],
        question: "Tell me about a recent project.",
        answer: "We cut p99 from 800ms to 80ms.",
      },
      expected: { decision: "FOLLOW_UP", dimension: "specificity" },
    });
    const result = await evaluateSuite(
      "golden",
      [fixture],
      new InterviewEngine({
        evaluate: async () => ({
          decision: "MOVE_ON",
          reason: "Concrete enough to move on.",
        }),
      }),
    );
    expect(result.failures[0]).toMatch(/dimension= final=/);
  });
});

describe("errorMessage", () => {
  it("uses Error.message or a fallback", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage("nope")).toBe("unknown error");
  });
});

describe("collectFailedProofs", () => {
  it("lists only failing proofs", () => {
    expect(
      collectFailedProofs({
        ok: { pass: true, evidence: "ok" },
        bad: { pass: false, evidence: "nope" },
      }),
    ).toEqual(["bad failed: nope"]);
  });
});

describe("buildLayer0Proofs", () => {
  it("proves layer 0 on the real repo", () => {
    const proofs = buildLayer0Proofs(repoRoot);
    expect(proofs["ACC-L0-SCHEMA"]?.pass).toBe(true);
    expect(proofs["ACC-UI-LANDING"]?.pass).toBe(true);
  });
});

describe("runHarness", () => {
  it("passes the repo evals when change review is skipped", async () => {
    const result = await runHarness({
      rootDir: repoRoot,
      changedFiles: [],
      now: () => new Date("2026-09-03T00:00:00.000Z"),
    });
    expect(result.ok).toBe(true);
    expect(result.trace.timestamp).toBe("2026-09-03T00:00:00.000Z");
    expect(result.trace.layer1.totalGoldens).toBeGreaterThanOrEqual(7);
    expect(result.trace.layer1.totalHoldouts).toBeGreaterThanOrEqual(3);
    expect(result.trace.layer1.totalCanaries).toBeGreaterThanOrEqual(1);
  });

  it("uses the system clock when now is omitted", async () => {
    const result = await runHarness({
      rootDir: repoRoot,
      changedFiles: [],
    });
    expect(result.trace.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("fails when evals are missing", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-"));
    fs.mkdirSync(path.join(root, "evals/goldens"), { recursive: true });
    const result = await runHarness({
      rootDir: root,
      changedFiles: [],
    });
    expect(result.ok).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});
