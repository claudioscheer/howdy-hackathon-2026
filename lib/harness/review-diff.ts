import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type ExecGit = (args: string[], cwd: string) => string;

export function defaultExecGit(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

export function collectChangedFiles(
  cwd: string,
  execGit: ExecGit = defaultExecGit,
  reviewBaseSha: string | undefined = process.env.REVIEW_BASE_SHA,
): string[] {
  const parts = [
    execGit(["diff", "--name-only", "HEAD"], cwd),
    execGit(["diff", "--name-only", "--cached"], cwd),
    execGit(["ls-files", "--others", "--exclude-standard"], cwd),
  ];
  const base = reviewBaseSha?.trim();
  if (base && !/^0+$/.test(base)) {
    parts.push(execGit(["diff", "--name-only", `${base}...HEAD`], cwd));
  }
  const files = new Set<string>();
  for (const part of parts) {
    for (const line of part.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        files.add(trimmed);
      }
    }
  }
  return [...files].sort();
}

export function isSecretPath(file: string): boolean {
  const base = path.basename(file);
  if (base === ".env.example") {
    return false;
  }
  return base === ".env" || base.startsWith(".env.");
}

export function colocatedTestPath(file: string): string | null {
  if (!file.startsWith("app/") && !file.startsWith("lib/")) {
    return null;
  }
  if (file.includes(".test.")) {
    return null;
  }
  if (file.endsWith(".tsx")) {
    return file.replace(/\.tsx$/, ".test.tsx");
  }
  if (file.endsWith(".ts")) {
    return file.replace(/\.ts$/, ".test.ts");
  }
  return null;
}

export function countableSourceLines(content: string): number {
  return content.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("*") &&
      trimmed !== "/*" &&
      trimmed !== "*/"
    );
  }).length;
}

export function reviewChangedFiles(
  rootDir: string,
  changedFiles: string[],
  maxLines = 200,
): string[] {
  const findings: string[] = [];
  for (const file of changedFiles) {
    if (isSecretPath(file)) {
      findings.push(`Secret file must not be committed: ${file}`);
      continue;
    }
    const abs = path.join(rootDir, file);
    const testPath = colocatedTestPath(file);
    if (!fs.existsSync(abs)) {
      continue;
    }
    if (testPath && !fs.existsSync(path.join(rootDir, testPath))) {
      findings.push(`Changed ${file} is missing colocated test ${testPath}`);
    }
    if (!testPath) {
      continue;
    }
    const lines = countableSourceLines(fs.readFileSync(abs, "utf8"));
    if (lines > maxLines) {
      findings.push(`${file} has ${lines} countable lines (max ${maxLines})`);
    }
  }
  return findings;
}

export function mapFilesToCriteria(changedFiles: string[]): string[] {
  const mapped = new Set<string>();
  for (const file of changedFiles) {
    if (file.startsWith("lib/interview/")) {
      mapped.add("ACC-RUNTIME-CONTRACTS");
    }
    if (
      file.includes("engine.ts") ||
      file.includes("heuristics.ts") ||
      file.startsWith("evals/")
    ) {
      mapped.add("ACC-HARNESS-BEHAVIOR");
    }
    if (file.includes("setup")) {
      mapped.add("ACC-PRODUCT-SESSION-CONFIG");
    }
    if (file.includes("interview")) {
      mapped.add("ACC-PRODUCT-ADAPTIVE-INTERVIEW");
    }
    if (file.includes("report")) {
      mapped.add("ACC-PRODUCT-GROUNDED-REPORT");
    }
    if (file.includes("review-") || file.includes("review.ts")) {
      mapped.add("ACC-HARNESS-REVIEW");
    }
  }
  return [...mapped].sort();
}
