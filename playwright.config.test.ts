import { describe, expect, it } from "vitest";
import config from "./playwright.config";

function webServerCommand(): string {
  const server = config.webServer;
  if (server === undefined || Array.isArray(server) || !("command" in server)) {
    throw new Error("Playwright must define a single webServer command.");
  }
  return server.command;
}

describe("playwright webServer", () => {
  it("builds a production app when .next is missing, then starts on 3010", () => {
    const command = webServerCommand();
    expect(command).toContain(".next/BUILD_ID");
    expect(command).toContain("next build");
    expect(command).toContain("next start");
    expect(command).toContain("--port 3010");
  });
});
