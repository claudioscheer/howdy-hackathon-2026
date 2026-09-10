import type { z } from "zod";
import {
  QuestionPlanSchema,
  type OpportunityProfile,
  type QuestionPlanner,
} from "./contracts";
import type { QuestionPlanInputSchema, UsedQuestionSchema } from "./contracts";
import {
  createOpenCodeClientFromEnv,
  type OpenCodeClient,
} from "./opencode-client";
import { completeJson } from "./opencode-json";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { PLANNER_SYSTEM_PROMPT } from "./planner-prompt";
import { briefedPlanProblems } from "./plan-quality";

export type QuestionBriefing = {
  opportunity: OpportunityProfile;
  attemptNumber: number;
  usedQuestions: z.infer<typeof UsedQuestionSchema>[];
  jobDescription: string;
  curriculum: string;
};

export interface QuestionGenerator {
  plan(briefing: QuestionBriefing): Promise<unknown>;
}

export function openCodeSessionId(
  kind: "question-plan" | "interview",
  id: string,
): string {
  return `${kind}:${id}`;
}

export async function planQuestionsWithOpenCode(
  client: OpenCodeClient,
  briefing: QuestionBriefing,
): Promise<unknown> {
  const plan = await completeJson(
    client,
    {
      sessionId: openCodeSessionId(
        "question-plan",
        `${briefing.opportunity.id}:attempt:${briefing.attemptNumber}`,
      ),
      maxTokens: DEFAULT_MAX_COMPLETION_TOKENS,
      messages: [
        { role: "system", content: PLANNER_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(briefing) },
      ],
    },
    QuestionPlanSchema,
  );
  const problems = briefedPlanProblems(
    plan,
    briefing.opportunity.interviewType,
  );
  if (problems.length > 0) {
    throw new Error("The question planner returned an invalid plan.");
  }
  return plan;
}

export function createOpenCodeQuestionGenerator(
  client: OpenCodeClient = createOpenCodeClientFromEnv(),
): QuestionGenerator {
  return {
    plan(briefing: QuestionBriefing): Promise<unknown> {
      return planQuestionsWithOpenCode(client, briefing);
    },
  };
}

export class OpenCodeQuestionPlanner implements QuestionPlanner {
  constructor(private readonly client: OpenCodeClient) {}

  async plan(input: z.infer<typeof QuestionPlanInputSchema>): Promise<unknown> {
    return planQuestionsWithOpenCode(this.client, {
      opportunity: input.opportunity,
      attemptNumber: input.attemptNumber,
      usedQuestions: input.usedQuestions,
      jobDescription: "",
      curriculum: "",
    });
  }
}
