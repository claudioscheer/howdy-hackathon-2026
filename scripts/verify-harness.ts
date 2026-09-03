import path from "node:path";
import { runHarness } from "../lib/harness/run";

async function main(): Promise<void> {
  const result = await runHarness({
    rootDir: path.resolve(import.meta.dirname, ".."),
  });
  if (!result.ok) {
    for (const failure of result.failures) {
      console.error(failure);
    }
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "unknown error";
  console.error(message);
  process.exit(1);
});
