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
  let searchFrom = 0;
  let sawObject = false;
  while (searchFrom < text.length) {
    const start = text.indexOf("{", searchFrom);
    if (start < 0) {
      break;
    }
    sawObject = true;
    const slice = firstJsonObject(text, start);
    if (slice === undefined) {
      throw new Error("OpenCode returned incomplete JSON.");
    }
    try {
      return JSON.parse(slice);
    } catch {
      searchFrom = start + 1;
    }
  }
  if (sawObject) {
    throw new Error("OpenCode returned incomplete JSON.");
  }
  throw new Error("OpenCode returned content that was not valid JSON.");
}

function firstJsonObject(text: string, start: number): string | undefined {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }
  return undefined;
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
