import {
  ReportEvaluationInputSchema,
  SessionReportSchema,
  type ReportEvaluator,
} from "./contracts";
import {
  createOpenCodeClientFromEnv,
  type OpenCodeClient,
} from "./opencode-client";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { completeJson } from "./opencode-json";
import { openCodeSessionId } from "./planner";
import { reportEvaluatorUserPayload } from "./report-evaluator-payload";
import { REPORT_EVALUATOR_SYSTEM_PROMPT } from "./report-evaluator-prompt";
import { applyReportScorePolicy } from "./report-policy";
import { repairSessionReport } from "./report-repair";

export function reportSessionId(input: unknown): string {
  const parsed = ReportEvaluationInputSchema.safeParse(input);
  if (!parsed.success) {
    return openCodeSessionId("interview", "report");
  }
  return openCodeSessionId(
    "interview",
    `${parsed.data.opportunity.id}:attempt:${parsed.data.attemptNumber}:report`,
  );
}

export class OpenCodeReportEvaluator implements ReportEvaluator {
  constructor(private readonly client: OpenCodeClient) {}

  async evaluate(input: unknown): Promise<unknown> {
    const parsed = ReportEvaluationInputSchema.safeParse(input);
    const transcript = parsed.success ? parsed.data.transcript : [];
    return completeJson(
      this.client,
      {
        sessionId: reportSessionId(input),
        maxTokens: DEFAULT_MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: REPORT_EVALUATOR_SYSTEM_PROMPT },
          { role: "user", content: reportEvaluatorUserPayload(input) },
        ],
      },
      SessionReportSchema,
      (raw) => {
        const repaired = repairSessionReport(raw, transcript);
        if (!parsed.success) {
          return repaired;
        }
        return applyReportScorePolicy(repaired, parsed.data);
      },
    );
  }
}

export function createOpenCodeReportEvaluator(
  client: OpenCodeClient = createOpenCodeClientFromEnv(),
): ReportEvaluator {
  return new OpenCodeReportEvaluator(client);
}
