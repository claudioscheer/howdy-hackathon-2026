import {
  AnswerEvaluationInputSchema,
  InterviewerDecisionSchema,
  type AnswerEvaluator,
} from "./contracts";
import { repairInterviewerDecision } from "./evaluation-repair";
import { answerEvaluatorUserPayload } from "./evaluator-payload";
import { ANSWER_EVALUATOR_SYSTEM_PROMPT } from "./evaluator-prompt";
import {
  createOpenCodeClientFromEnv,
  type OpenCodeClient,
} from "./opencode-client";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { completeJson } from "./opencode-json";
import { openCodeSessionId, questionPlanSessionId } from "./planner";

export function evaluationSessionId(input: unknown): string {
  const parsed = AnswerEvaluationInputSchema.safeParse(input);
  if (!parsed.success) {
    return openCodeSessionId("question-plan", "answer-eval");
  }
  return questionPlanSessionId(
    parsed.data.opportunity.id,
    parsed.data.attemptNumber ?? 1,
  );
}

function latestAnswerFrom(input: unknown): string {
  const parsed = AnswerEvaluationInputSchema.safeParse(input);
  if (!parsed.success) {
    return "";
  }
  return parsed.data.answer;
}

export class OpenCodeAnswerEvaluator implements AnswerEvaluator {
  constructor(private readonly client: OpenCodeClient) {}

  async evaluate(input: unknown): Promise<unknown> {
    return completeJson(
      this.client,
      {
        sessionId: evaluationSessionId(input),
        maxTokens: DEFAULT_MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: ANSWER_EVALUATOR_SYSTEM_PROMPT },
          { role: "user", content: answerEvaluatorUserPayload(input) },
        ],
      },
      InterviewerDecisionSchema,
      (raw) => repairInterviewerDecision(raw, latestAnswerFrom(input)),
    );
  }
}

export function createOpenCodeAnswerEvaluator(
  client: OpenCodeClient = createOpenCodeClientFromEnv(),
): AnswerEvaluator {
  return new OpenCodeAnswerEvaluator(client);
}
