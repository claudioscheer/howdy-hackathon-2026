import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENCODE_BASE_URL,
  DEFAULT_OPENCODE_MODEL,
  OPENCODE_FETCH_TIMEOUT_MS,
  readOpenCodeConfig,
} from "./opencode-config";

describe("readOpenCodeConfig", () => {
  it("caps live interviewer requests so practice cannot hang", () => {
    expect(OPENCODE_FETCH_TIMEOUT_MS).toBe(60_000);
  });

  it("requires an API key", () => {
    expect(() => readOpenCodeConfig({})).toThrow(
      "OPENCODE_API_KEY is not set.",
    );
    expect(() => readOpenCodeConfig({ OPENCODE_API_KEY: "  " })).toThrow(
      "OPENCODE_API_KEY is not set.",
    );
  });

  it("applies defaults and optional workspace id", () => {
    expect(readOpenCodeConfig({ OPENCODE_API_KEY: " sk-test " })).toEqual({
      apiKey: "sk-test",
      baseUrl: DEFAULT_OPENCODE_BASE_URL,
      model: DEFAULT_OPENCODE_MODEL,
      workspaceId: undefined,
    });
    expect(
      readOpenCodeConfig({
        OPENCODE_API_KEY: "sk-test",
        OPENCODE_BASE_URL: "https://example.test/v1",
        OPENCODE_MODEL: "minimax-m3",
        OPENCODE_WORKSPACE_ID: "wrk_123",
      }),
    ).toEqual({
      apiKey: "sk-test",
      baseUrl: "https://example.test/v1",
      model: "minimax-m3",
      workspaceId: "wrk_123",
    });
  });

  it("treats a blank workspace id as absent", () => {
    expect(
      readOpenCodeConfig({
        OPENCODE_API_KEY: "sk-test",
        OPENCODE_WORKSPACE_ID: "   ",
      }).workspaceId,
    ).toBeUndefined();
  });
});
