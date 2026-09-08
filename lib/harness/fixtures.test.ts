import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EvalScenarioSchema,
  loadScenarioFile,
  loadScenariosFromDir,
} from "./fixtures";

const sample = {
  id: "sample",
  description: "A valid runtime scenario.",
  steps: [
    {
      answer: "A candidate answer.",
      expected: {
        outcome: "APPLIED",
        recommendedDecision: "MOVE_ON",
        questionIndex: 1,
        followUpCount: 0,
        historyLength: 3,
        status: "AWAITING_ANSWER",
      },
    },
  ],
};

describe("EvalScenarioSchema", () => {
  it("defaults to the scripted evaluator and rejects incomplete steps", () => {
    expect(EvalScenarioSchema.parse(sample).evaluator).toBe("SCRIPTED");
    expect(EvalScenarioSchema.safeParse({ ...sample, steps: [] }).success).toBe(
      false,
    );
  });
});

describe("scenario loading", () => {
  it("returns no scenarios when a suite directory is absent", () => {
    expect(
      loadScenariosFromDir(path.join(os.tmpdir(), "missing-evals")),
    ).toEqual([]);
  });

  it("loads JSON scenarios in filename order and ignores other files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scenarios-"));
    fs.writeFileSync(path.join(dir, "b.json"), JSON.stringify(sample));
    fs.writeFileSync(path.join(dir, "skip.txt"), "ignored");
    expect(loadScenariosFromDir(dir)).toHaveLength(1);
  });

  it("rejects invalid schema and malformed JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bad-scenarios-"));
    const invalid = path.join(dir, "invalid.json");
    fs.writeFileSync(invalid, JSON.stringify({ id: "bad" }));
    expect(() => loadScenarioFile(invalid)).toThrow(/Invalid scenario/);
    const malformed = path.join(dir, "malformed.json");
    fs.writeFileSync(malformed, "{");
    expect(() => loadScenarioFile(malformed)).toThrow();
  });
});
