import { z } from "zod";
import { completionText } from "./completion-text";
import type { OpenCodeConfig } from "./opencode-config";
import {
  DEFAULT_MAX_COMPLETION_TOKENS,
  readOpenCodeConfig,
} from "./opencode-config";

export type OpenCodeRole = "system" | "user" | "assistant";

export type OpenCodeMessage = {
  role: OpenCodeRole;
  content: string;
};

export type OpenCodeCompleteInput = {
  sessionId: string;
  requestId?: string;
  messages: OpenCodeMessage[];
  json?: boolean;
  maxTokens?: number;
};

export interface OpenCodeClient {
  complete(input: OpenCodeCompleteInput): Promise<string>;
}

const OpenCodeErrorSchema = z.object({
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
  message: z.string().optional(),
});

export function createOpenCodeClient(
  config: OpenCodeConfig,
  fetchImpl: typeof fetch = fetch,
): OpenCodeClient {
  return {
    complete(input: OpenCodeCompleteInput): Promise<string> {
      return completeOpenCodeChat(config, input, fetchImpl);
    },
  };
}

export function createOpenCodeClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): OpenCodeClient {
  return createOpenCodeClient(readOpenCodeConfig(env), fetchImpl);
}

async function completeOpenCodeChat(
  config: OpenCodeConfig,
  input: OpenCodeCompleteInput,
  fetchImpl: typeof fetch,
): Promise<string> {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: requestHeaders(config, input),
    body: JSON.stringify(requestBody(config, input)),
  });
  const payload = await readJsonBody(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, response.status));
  }
  return completionText(payload);
}

function requestHeaders(
  config: OpenCodeConfig,
  input: OpenCodeCompleteInput,
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "x-opencode-session": input.sessionId,
    "x-opencode-request": input.requestId ?? crypto.randomUUID(),
  };
  if (config.workspaceId !== undefined) {
    headers["x-opencode-workspace"] = config.workspaceId;
  }
  return headers;
}

function requestBody(
  config: OpenCodeConfig,
  input: OpenCodeCompleteInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: input.messages,
    max_tokens: input.maxTokens ?? DEFAULT_MAX_COMPLETION_TOKENS,
  };
  if (input.json === true) {
    body.response_format = { type: "json_object" };
  }
  return body;
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `OpenCode returned a non-JSON response (${response.status}).`,
    );
  }
}

function errorMessage(payload: unknown, status: number): string {
  const parsed = OpenCodeErrorSchema.safeParse(payload);
  const detail = parsed.data?.error?.message ?? parsed.data?.message;
  if (detail !== undefined && detail.length > 0) {
    return `OpenCode request failed (${status}): ${detail}`;
  }
  return `OpenCode request failed (${status}).`;
}
