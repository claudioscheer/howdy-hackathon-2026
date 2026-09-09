export const DEFAULT_OPENCODE_BASE_URL = "https://opencode.ai/zen/v1";
export const DEFAULT_OPENCODE_MODEL = "glm-5.3-flash";

export type OpenCodeConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  workspaceId: string | undefined;
};

export function readOpenCodeConfig(
  env: NodeJS.ProcessEnv = process.env,
): OpenCodeConfig {
  const apiKey = env.OPENCODE_API_KEY?.trim() ?? "";
  if (apiKey.length === 0) {
    throw new Error("OPENCODE_API_KEY is not set.");
  }
  const workspaceId = env.OPENCODE_WORKSPACE_ID?.trim() ?? "";
  return {
    apiKey,
    baseUrl: env.OPENCODE_BASE_URL?.trim() || DEFAULT_OPENCODE_BASE_URL,
    model: env.OPENCODE_MODEL?.trim() || DEFAULT_OPENCODE_MODEL,
    workspaceId: workspaceId.length > 0 ? workspaceId : undefined,
  };
}
