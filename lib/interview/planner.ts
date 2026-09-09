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

const PLANNER_SYSTEM_PROMPT = [
  "You plan mock interview questions for a fictional practice interview.",
  "Return JSON only in this shape:",
  '{"questions":[{"id":"string","prompt":"string","primaryDimension":"relevance"|"specificity"|"fundamentals"|"structure"}]}',
  "Propose exactly 3 questions tailored to the role, seniority, interview type, tech stack, job description, and candidate curriculum.",
  "Each prompt must be a single interviewer question the candidate can answer in text.",
  "Do not repeat used questions. Cover distinct rubric dimensions when possible.",
].join(" ");

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
  return completeJson(
    client,
    {
      sessionId: openCodeSessionId(
        "question-plan",
        `${briefing.opportunity.id}:attempt:${briefing.attemptNumber}`,
      ),
      messages: [
        { role: "system", content: PLANNER_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(briefing) },
      ],
    },
    QuestionPlanSchema,
  );
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
