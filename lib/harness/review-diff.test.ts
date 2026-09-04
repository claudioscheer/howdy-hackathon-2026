import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectChangedFiles,
  colocatedTestPath,
  countableSourceLines,
  defaultExecGit,
  isSecretPath,
  mapFilesToCriteria,
  reviewChangedFiles,
} from "./review-diff";

describe("defaultExecGit", () => {
  it("returns git output when the command works", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    expect(
      defaultExecGit(["rev-parse", "--is-inside-work-tree"], root).trim(),
    ).toBe("true");
  });

  it("returns empty string when git fails", () => {
    expect(defaultExecGit(["not-a-real-git-command"], os.tmpdir())).toBe("");
  });
});

describe("collectChangedFiles", () => {
  it("splits, trims, and sorts unique paths", () => {
    const files = collectChangedFiles("/tmp", (args) => {
      if (args.includes("--cached")) {
        return "lib/a.ts\n";
      }
      if (args.includes("--others")) {
        return "lib/a.ts\nlib/b.ts\n";
      }
      return " README.md \n";
    });
    expect(files).toEqual(["README.md", "lib/a.ts", "lib/b.ts"]);
  });

  it("ignores blank lines", () => {
    expect(collectChangedFiles("/tmp", () => "\n\n")).toEqual([]);
  });

  it("includes the committed CI range when a base SHA is provided", () => {
    const files = collectChangedFiles(
      "/tmp",
      (args) => (args.includes("base-sha...HEAD") ? "lib/committed.ts\n" : ""),
      "base-sha",
    );
    expect(files).toEqual(["lib/committed.ts"]);
  });

  it("ignores blank and all-zero CI base values", () => {
    expect(collectChangedFiles("/tmp", () => "", " ")).toEqual([]);
    expect(collectChangedFiles("/tmp", () => "", "000000")).toEqual([]);
  });
});

describe("path helpers", () => {
  it("treats env files as secrets except .env.example", () => {
    expect(isSecretPath(".env")).toBe(true);
    expect(isSecretPath(".env.local")).toBe(true);
    expect(isSecretPath(".env.example")).toBe(false);
    expect(isSecretPath("README.md")).toBe(false);
  });

  it("maps app and lib sources to colocated tests", () => {
    expect(colocatedTestPath("lib/harness/foo.ts")).toBe(
      "lib/harness/foo.test.ts",
    );
    expect(colocatedTestPath("app/page.tsx")).toBe("app/page.test.tsx");
    expect(colocatedTestPath("lib/harness/foo.test.ts")).toBeNull();
    expect(colocatedTestPath("scripts/verify-harness.ts")).toBeNull();
    expect(colocatedTestPath("lib/ui/copy.css")).toBeNull();
  });

  it("counts non-comment source lines", () => {
    const content = ["", "// comment", "const x = 1;", "/*", "*", "*/"].join(
      "\n",
    );
    expect(countableSourceLines(content)).toBe(1);
  });
});

describe("reviewChangedFiles", () => {
  it("flags secrets, missing tests, and oversized sources", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "review-"));
    fs.mkdirSync(path.join(root, "lib"), { recursive: true });
    fs.writeFileSync(path.join(root, "lib/ok.ts"), "export const ok = 1;\n");
    fs.writeFileSync(path.join(root, "lib/ok.test.ts"), "test");
    fs.writeFileSync(
      path.join(root, "lib/missing.ts"),
      "export const missing = 1;\n",
    );
    fs.writeFileSync(
      path.join(root, "lib/big.ts"),
      Array.from({ length: 210 }, (_, i) => `export const n${i} = ${i};`).join(
        "\n",
      ),
    );
    fs.writeFileSync(path.join(root, "lib/big.test.ts"), "test");
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs/HARNESS.md"), "# Docs\n");
    const findings = reviewChangedFiles(root, [
      ".env.local",
      "lib/missing.ts",
      "lib/big.ts",
      "lib/ok.ts",
      "docs/HARNESS.md",
      "lib/deleted.ts",
    ]);
    expect(findings.join("\n")).toMatch(/Secret file/);
    expect(findings.join("\n")).toMatch(/missing colocated test/);
    expect(findings.join("\n")).toMatch(/countable lines/);
    expect(findings.join("\n")).not.toMatch(/lib\/ok\.ts/);
  });
});

describe("mapFilesToCriteria", () => {
  it("maps changed paths onto acceptance ids", () => {
    expect(
      mapFilesToCriteria([
        "lib/harness/schema.ts",
        "lib/harness/contracts.ts",
        "lib/interview/contracts.ts",
        "lib/harness/engine.ts",
        "lib/harness/heuristics.ts",
        "evals/goldens/a.json",
        "evals/holdouts/b.json",
        "lib/harness/review.ts",
        "lib/harness/review-diff.ts",
        "app/setup/page.tsx",
        "app/interview/page.tsx",
        "app/report/page.tsx",
      ]),
    ).toEqual([
      "ACC-HARNESS-BEHAVIOR",
      "ACC-HARNESS-REVIEW",
      "ACC-PRODUCT-ADAPTIVE-INTERVIEW",
      "ACC-PRODUCT-GROUNDED-REPORT",
      "ACC-PRODUCT-SESSION-CONFIG",
      "ACC-RUNTIME-CONTRACTS",
    ]);
    expect(mapFilesToCriteria(["README.md"])).toEqual([]);
  });
});
