export function hasCoverageFlag(args: readonly string[]): boolean {
  return args.some(
    (arg) =>
      arg === "--coverage" ||
      arg.startsWith("--coverage=") ||
      arg === "--no-coverage",
  );
}

export function hasTargetOrFilter(args: readonly string[]): boolean {
  return args.some(
    (arg) =>
      !arg.startsWith("-") ||
      arg === "--changed" ||
      arg.startsWith("--changed="),
  );
}

export function isAllTestsRequested(
  args: readonly string[],
  env: Record<string, string | undefined>,
): boolean {
  return (
    args.includes("--all") || env.TEST_ALL === "1" || env.TEST_ALL === "true"
  );
}

export function resolveChangedTarget(
  reviewBaseSha: string | undefined,
): string[] {
  const base = reviewBaseSha?.trim();
  if (base && !/^0+$/.test(base)) {
    return ["--changed", base];
  }
  return ["--changed"];
}

export function resolveTestArgs(
  cliArgs: readonly string[] = [],
  env: Record<string, string | undefined> = process.env,
): string[] {
  const filteredArgs = cliArgs.filter((arg) => arg !== "--all");
  const wantsAll = isAllTestsRequested(cliArgs, env);
  const wantsCoverage = !hasCoverageFlag(filteredArgs);

  if (wantsAll || hasTargetOrFilter(filteredArgs)) {
    const result = ["run", ...filteredArgs];
    if (wantsCoverage) {
      result.push("--coverage");
    }
    return result;
  }

  const result = [
    "run",
    ...resolveChangedTarget(env.REVIEW_BASE_SHA),
    ...filteredArgs,
  ];
  if (wantsCoverage) {
    result.push("--coverage");
  }
  return result;
}
