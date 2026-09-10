import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { OpenCodeClient } from "./opencode-client";
import { completeJson, parseModelJson } from "./opencode-json";

describe("parseModelJson", () => {
  it("parses bare and fenced JSON objects", () => {
    expect(parseModelJson('{"ok":true}')).toEqual({ ok: true });
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("extracts an embedded object or rejects invalid content", () => {
    expect(parseModelJson('prefix {"ok":true} suffix')).toEqual({ ok: true });
    expect(parseModelJson('prefix {"nested": {"inner": true}} suffix')).toEqual(
      {
        nested: { inner: true },
      },
    );
    expect(
      parseModelJson('prefix {"quote":"a \\"b\\\\\\"{ end"} suffix'),
    ).toEqual({
      quote: 'a "b\\"{ end',
    });
    expect(() => parseModelJson("not json")).toThrow(
      "OpenCode returned content that was not valid JSON.",
    );
    expect(() => parseModelJson("prefix {not json} suffix")).toThrow(
      "OpenCode returned incomplete JSON.",
    );
    expect(() => parseModelJson('{ "ok": true')).toThrow(
      "OpenCode returned incomplete JSON.",
    );
  });
});

describe("completeJson", () => {
  it("asks for JSON and parses it with the schema", async () => {
    const complete = vi.fn(async () => '{"ok":true}');
    const client: OpenCodeClient = { complete };
    await expect(
      completeJson(
        client,
        { sessionId: "s1", messages: [{ role: "user", content: "hi" }] },
        z.object({ ok: z.literal(true) }),
      ),
    ).resolves.toEqual({ ok: true });
    expect(complete).toHaveBeenCalledWith({
      sessionId: "s1",
      messages: [{ role: "user", content: "hi" }],
      json: true,
    });
  });

  it("repairs parsed JSON before schema validation", async () => {
    const client: OpenCodeClient = {
      complete: async () => '{"ok":false}',
    };
    await expect(
      completeJson(
        client,
        { sessionId: "s1", messages: [] },
        z.object({ ok: z.literal(true) }),
        () => ({ ok: true }),
      ),
    ).resolves.toEqual({ ok: true });
  });

  it("rejects JSON that does not match the schema", async () => {
    const client: OpenCodeClient = {
      complete: async () => '{"ok":false}',
    };
    await expect(
      completeJson(
        client,
        { sessionId: "s1", messages: [] },
        z.object({ ok: z.literal(true) }),
      ),
    ).rejects.toThrow("OpenCode returned JSON that did not match the schema.");
  });
});
