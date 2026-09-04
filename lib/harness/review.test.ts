import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixturesFromDir } from "./fixtures";
import { reviewHarness } from "./review";

describe("reviewHarness", () => {
  it("passes the repo suite when change review is skipped", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const report = reviewHarness({
      goldens: loadFixturesFromDir(path.join(root, "evals/goldens")),
      holdouts: loadFixturesFromDir(path.join(root, "evals/holdouts")),
      rootDir: root,
      changedFiles: [],
    });
    expect(report.findings).toEqual([]);
    expect(report.changedFiles).toEqual([]);
    expect(report.mappedCriteria).toEqual([]);
  });

  it("collects the git working tree when changedFiles is omitted", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const report = reviewHarness({
      goldens: loadFixturesFromDir(path.join(root, "evals/goldens")),
      holdouts: loadFixturesFromDir(path.join(root, "evals/holdouts")),
      rootDir: root,
    });
    expect(Array.isArray(report.changedFiles)).toBe(true);
    expect(report.changedFiles.length).toBeGreaterThanOrEqual(0);
  });
});
