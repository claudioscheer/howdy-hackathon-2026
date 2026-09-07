import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadScenariosFromDir } from "./fixtures";
import { reviewHarness } from "./review";

describe("reviewHarness", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const input = {
    goldens: loadScenariosFromDir(path.join(root, "evals/goldens")),
    holdouts: loadScenariosFromDir(path.join(root, "evals/holdouts")),
    rootDir: root,
  };

  it("passes the independent repository suites when source review is skipped", () => {
    expect(reviewHarness({ ...input, changedFiles: [] })).toEqual({
      findings: [],
      changedFiles: [],
      mappedCriteria: [],
    });
  });

  it("can collect changed files from git", () => {
    expect(Array.isArray(reviewHarness(input).changedFiles)).toBe(true);
  });
});
