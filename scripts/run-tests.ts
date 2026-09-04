import { spawnSync } from "node:child_process";
import path from "node:path";
import { resolveTestArgs } from "../lib/harness/test-args";

export function runTests(
  cliArgs: readonly string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): void {
  const vitestBin = path.resolve(
    import.meta.dirname,
    "../node_modules/vitest/vitest.mjs",
  );
  const args = resolveTestArgs(cliArgs, env);
  const result = spawnSync(process.execPath, [vitestBin, ...args], {
    stdio: "inherit",
    env,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runTests();
