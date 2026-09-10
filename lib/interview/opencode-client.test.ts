import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOpenCodeClient,
  createOpenCodeClientFromEnv,
} from "./opencode-client";
import type { OpenCodeConfig } from "./opencode-config";
import {
  DEFAULT_OPENCODE_BASE_URL,
  DEFAULT_OPENCODE_MODEL,
} from "./opencode-config";

const config: OpenCodeConfig = {
  apiKey: "sk-test",
  baseUrl: "https://opencode.test/v1",
  model: "glm-5.3-flash",
  workspaceId: "wrk_123",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenCode client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts a chat completion with session and workspace headers", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        choices: [{ message: { content: "  hello  " } }],
      }),
    );
    const client = createOpenCodeClient(config, fetchImpl);
    await expect(
      client.complete({
        sessionId: "question-plan:opp-1",
        requestId: "req-1",
        messages: [{ role: "user", content: "Hi" }],
        json: true,
        maxTokens: 64,
      }),
    ).resolves.toBe("hello");
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://opencode.test/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
          "x-opencode-session": "question-plan:opp-1",
          "x-opencode-request": "req-1",
          "x-opencode-workspace": "wrk_123",
        },
        body: JSON.stringify({
          model: "glm-5.3-flash",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 64,
          response_format: { type: "json_object" },
        }),
      }),
    );
  });

  it("omits the workspace header and assigns a request id when needed", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-0000-0000-000000000001",
    );
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: "ok" } }] }),
    );
    const client = createOpenCodeClient(
      { ...config, workspaceId: undefined },
      fetchImpl,
    );
    await client.complete({
      sessionId: "interview:s1",
      messages: [{ role: "system", content: "Be brief." }],
    });
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init).toEqual(
      expect.objectContaining({
        headers: {
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
          "x-opencode-session": "interview:s1",
          "x-opencode-request": "00000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          model: "glm-5.3-flash",
          messages: [{ role: "system", content: "Be brief." }],
          max_tokens: 8192,
        }),
      }),
    );
  });

  it("reads config from env", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: "ok" } }] }),
    );
    const client = createOpenCodeClientFromEnv(
      { OPENCODE_API_KEY: "sk-env" },
      fetchImpl,
    );
    await client.complete({ sessionId: "s", messages: [] });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      `${DEFAULT_OPENCODE_BASE_URL}/chat/completions`,
    );
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk-env",
        }),
        body: expect.stringContaining(DEFAULT_OPENCODE_MODEL),
      }),
    );
  });

  it("surfaces HTTP and empty completion failures", async () => {
    const failed = createOpenCodeClient(config, async () =>
      jsonResponse({ error: { message: "Model is disabled" } }, 401),
    );
    await expect(
      failed.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode request failed (401): Model is disabled");

    const messageOnly = createOpenCodeClient(config, async () =>
      jsonResponse({ message: "nope" }, 500),
    );
    await expect(
      messageOnly.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode request failed (500): nope");

    const bare = createOpenCodeClient(config, async () =>
      jsonResponse({}, 502),
    );
    await expect(
      bare.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode request failed (502).");

    const nonJson = createOpenCodeClient(
      config,
      async () => new Response("oops", { status: 503 }),
    );
    await expect(
      nonJson.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode returned a non-JSON response (503).");

    const emptyMessage = createOpenCodeClient(config, async () =>
      jsonResponse({ error: { message: "" } }, 400),
    );
    await expect(
      emptyMessage.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode request failed (400).");

    const empty = createOpenCodeClient(config, async () =>
      jsonResponse({
        choices: [{ finish_reason: "length", message: { content: null } }],
      }),
    );
    await expect(
      empty.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow(
      "OpenCode returned an empty completion (finish_reason=length).",
    );

    const missing = createOpenCodeClient(config, async () =>
      jsonResponse({ choices: [] }),
    );
    await expect(
      missing.complete({ sessionId: "s", messages: [] }),
    ).rejects.toThrow("OpenCode returned an empty completion.");
  });
});
