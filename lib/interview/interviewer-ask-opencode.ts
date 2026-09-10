import { z } from "zod";
import type { QuestionAskInput, QuestionSpeaker } from "./interviewer-ask";
import {
  createOpenCodeClientFromEnv,
  type OpenCodeClient,
} from "./opencode-client";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { completeJson } from "./opencode-json";
import { questionPlanSessionId } from "./planner";

const AskSchema = z.object({
  ask: z.string().trim().min(1),
});

export const NEXT_QUESTION_SYSTEM_PROMPT = [
  "You ask the next planned practice-interview topic in your own words.",
  'Return JSON only: {"ask":"string"}.',
  "Ask one question. Cover the planned topic and brief. You may connect to earlier answers, but do not skip the topic.",
  "Do not praise, hint, or coach.",
].join(" ");

export class OpenCodeQuestionSpeaker implements QuestionSpeaker {
  constructor(private readonly client: OpenCodeClient) {}

  async speak(input: QuestionAskInput): Promise<string> {
    const spoken = await completeJson(
      this.client,
      {
        sessionId: questionPlanSessionId(
          input.opportunityId,
          input.attemptNumber,
        ),
        maxTokens: DEFAULT_MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: NEXT_QUESTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              role: input.role,
              plannedPrompt: input.planned.prompt,
              brief: input.planned.brief ?? null,
              recentTurns: input.history.slice(-8).map((turn) => ({
                speaker: turn.speaker,
                kind: turn.kind,
                content: turn.content,
              })),
            }),
          },
        ],
      },
      AskSchema,
    );
    return spoken.ask;
  }
}

export function createOpenCodeQuestionSpeaker(
  client: OpenCodeClient = createOpenCodeClientFromEnv(),
): QuestionSpeaker {
  return new OpenCodeQuestionSpeaker(client);
}
