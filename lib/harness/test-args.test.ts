import { describe, expect, it } from "vitest";
import {
  hasCoverageFlag,
  hasTargetOrFilter,
  isAllTestsRequested,
  resolveChangedTarget,
  resolveTestArgs,
} from "./test-args";

describe("test-args", () => {
  describe("hasCoverageFlag", () => {
    it("detects coverage flags", () => {
      expect(hasCoverageFlag(["--coverage"])).toBe(true);
      expect(hasCoverageFlag(["--coverage=v8"])).toBe(true);
      expect(hasCoverageFlag(["--no-coverage"])).toBe(true);
      expect(hasCoverageFlag(["--run", "--watch"])).toBe(false);
    });
  });

  describe("hasTargetOrFilter", () => {
    it("detects positional targets and changed flags", () => {
      expect(hasTargetOrFilter(["app/page.test.tsx"])).toBe(true);
      expect(hasTargetOrFilter(["--changed"])).toBe(true);
      expect(hasTargetOrFilter(["--changed=HEAD~1"])).toBe(true);
      expect(hasTargetOrFilter(["--reporter=verbose"])).toBe(false);
    });
  });

  describe("isAllTestsRequested", () => {
    it("detects --all in args or TEST_ALL in env", () => {
      expect(isAllTestsRequested(["--all"], {})).toBe(true);
      expect(isAllTestsRequested([], { TEST_ALL: "1" })).toBe(true);
      expect(isAllTestsRequested([], { TEST_ALL: "true" })).toBe(true);
      expect(isAllTestsRequested([], { TEST_ALL: "0" })).toBe(false);
      expect(isAllTestsRequested([], {})).toBe(false);
    });
  });

  describe("resolveChangedTarget", () => {
    it("handles undefined or all-zero SHA", () => {
      expect(resolveChangedTarget(undefined)).toEqual(["--changed"]);
      expect(resolveChangedTarget("")).toEqual(["--changed"]);
      expect(
        resolveChangedTarget("0000000000000000000000000000000000000000"),
      ).toEqual(["--changed"]);
    });

    it("handles valid base SHA", () => {
      expect(resolveChangedTarget("  abc1234  ")).toEqual([
        "--changed",
        "abc1234",
      ]);
    });
  });

  describe("resolveTestArgs", () => {
    it("defaults to changed mode with coverage", () => {
      expect(resolveTestArgs([], {})).toEqual([
        "run",
        "--changed",
        "--coverage",
      ]);
    });

    it("uses REVIEW_BASE_SHA when provided", () => {
      expect(resolveTestArgs([], { REVIEW_BASE_SHA: "base-commit" })).toEqual([
        "run",
        "--changed",
        "base-commit",
        "--coverage",
      ]);
    });

    it("supports --all flag", () => {
      expect(resolveTestArgs(["--all"], {})).toEqual(["run", "--coverage"]);
      expect(resolveTestArgs(["--all", "--no-coverage"], {})).toEqual([
        "run",
        "--no-coverage",
      ]);
    });

    it("supports specific test target without forcing --changed", () => {
      expect(resolveTestArgs(["app/page.test.tsx"], {})).toEqual([
        "run",
        "app/page.test.tsx",
        "--coverage",
      ]);
    });

    it("preserves explicit coverage flags and extra arguments", () => {
      expect(resolveTestArgs(["--coverage=v8"], {})).toEqual([
        "run",
        "--changed",
        "--coverage=v8",
      ]);
      expect(resolveTestArgs(["--changed", "HEAD~1"], {})).toEqual([
        "run",
        "--changed",
        "HEAD~1",
        "--coverage",
      ]);
    });
  });
});
