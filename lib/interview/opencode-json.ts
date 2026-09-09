import type { ZodType } from "zod";
import type { OpenCodeClient, OpenCodeCompleteInput } from "./opencode-client";

export function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return parseJsonText(candidate);
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return parseEmbeddedJson(text);
  }
}

function parseEmbeddedJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("OpenCode returned content that was not valid JSON.");
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("OpenCode returned content that was not valid JSON.");
  }
}

export async function completeJson<T>(
  client: OpenCodeClient,
  input: OpenCodeCompleteInput,
  schema: ZodType<T>,
): Promise<T> {
  const content = await client.complete({ ...input, json: true });
  const parsed = schema.safeParse(parseModelJson(content));
  if (!parsed.success) {
    throw new Error("OpenCode returned JSON that did not match the schema.");
  }
  return parsed.data;
}
