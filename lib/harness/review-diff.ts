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
): string[] {
  const parts = [
    execGit(["diff", "--name-only", "HEAD"], cwd),
    execGit(["diff", "--name-only", "--cached"], cwd),
    execGit(["ls-files", "--others", "--exclude-standard"], cwd),
  ];
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
    if (testPath && !fs.existsSync(path.join(rootDir, testPath))) {
      findings.push(`Changed ${file} is missing colocated test ${testPath}`);
    }
    if (!testPath || !fs.existsSync(abs)) {
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
    if (file.includes("schema.ts") || file.includes("contracts.ts")) {
      mapped.add("ACC-L0-SCHEMA");
      mapped.add("ACC-L0-GROUNDING");
      mapped.add("ACC-L0-STATE-CAP");
      mapped.add("ACC-L0-EMPTY-ANSWER");
    }
    if (file.includes("engine.ts") || file.includes("heuristics.ts")) {
      mapped.add("ACC-L1-GOLDENS");
    }
    if (file.includes("evals/goldens/")) {
      mapped.add("ACC-L1-GOLDENS");
    }
    if (file.includes("evals/holdouts/")) {
      mapped.add("ACC-L1-HOLDOUTS");
    }
    if (file.includes("evals/canaries/")) {
      mapped.add("ACC-L1-CANARIES");
    }
    if (file.includes("review-") || file.includes("review.ts")) {
      mapped.add("ACC-L2-REVIEW");
    }
    if (file.startsWith("app/page")) {
      mapped.add("ACC-UI-LANDING");
    }
  }
  return [...mapped].sort();
}
