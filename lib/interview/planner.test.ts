import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenCodeClient } from "./opencode-client";
import {
  OpenCodeQuestionPlanner,
  createOpenCodeQuestionGenerator,
  openCodeSessionId,
  planQuestionsWithOpenCode,
  type QuestionBriefing,
} from "./planner";

const briefing: QuestionBriefing = {
  opportunity: {
    id: "opp-2",
    role: "fullstack",
    seniority: "senior",
    targetTechStack: ["TypeScript", "PostgreSQL"],
    interviewType: "behavioral",
  },
  attemptNumber: 1,
  usedQuestions: [{ id: "used-1", prompt: "Old question?" }],
  jobDescription: "Build the interview coach.",
  curriculum: "Shipped React apps.",
};

function sampleBrief(
  competency: string,
  importance: "core" | "supporting",
  timeBudgetMinutes: number,
  maxFollowUps: 1 | 2,
  answerBudget: number,
) {
  return {
    competency,
    roleRelevance: "Needed for this role.",
    importance,
    expectedDepth: "A concrete owned example at this seniority.",
    evidenceToListenFor: ["owned action"],
    followUpTriggers: ["missing ownership"],
    timeBudgetMinutes,
    answerBudget,
    maxFollowUps,
    stopWhen: ["the expected evidence is present"],
  };
}

const plan = {
  questions: [
    {
      id: "q-1",
      prompt: "What have you focused on in the last year?",
      primaryDimension: "specificity",
      brief: sampleBrief("Recent ownership", "core", 8, 2, 3),
    },
    {
      id: "q-2",
      prompt: "Walk through a TypeScript change you owned.",
      primaryDimension: "fundamentals",
      brief: sampleBrief("TypeScript delivery", "core", 9, 2, 3),
    },
    {
      id: "q-3",
      prompt: "How did you design the PostgreSQL schema for that change?",
      primaryDimension: "fundamentals",
      brief: sampleBrief("Data modeling", "core", 8, 2, 3),
    },
    {
      id: "q-4",
      prompt: "Tell me about a disagreement with a teammate.",
      primaryDimension: "structure",
      brief: sampleBrief("Collaboration", "supporting", 5, 1, 2),
    },
  ],
};

describe("OpenCode question planner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("names reusable session ids for planning and interview turns", () => {
    expect(openCodeSessionId("question-plan", "opp-2:attempt:1")).toBe(
      "question-plan:opp-2:attempt:1",
    );
    expect(openCodeSessionId("interview", "practice-1")).toBe(
      "interview:practice-1",
    );
  });

  it("rejects a three-prompt plan that has no interviewer briefs", async () => {
    const complete = vi.fn(async () =>
      JSON.stringify({
        questions: [
          {
            id: "q-1",
            prompt: "Only one prompt?",
            primaryDimension: "specificity",
          },
        ],
      }),
    );
    const client: OpenCodeClient = { complete };
    await expect(planQuestionsWithOpenCode(client, briefing)).rejects.toThrow(
      "The question planner returned an invalid plan.",
    );
  });

  it("asks OpenCode for a structured question plan", async () => {
    const complete = vi.fn(async () => JSON.stringify(plan));
    const client: OpenCodeClient = { complete };
    await expect(planQuestionsWithOpenCode(client, briefing)).resolves.toEqual({
      ...plan,
      targetMinutes: 40,
      sessionAnswerBudget: 10,
    });
    expect(complete).toHaveBeenCalledWith({
      sessionId: "question-plan:opp-2:attempt:1",
      json: true,
      maxTokens: 8192,
      messages: [
        {
          role: "system",
          content: expect.stringContaining("close to 40 minutes"),
        },
        { role: "user", content: JSON.stringify(briefing) },
      ],
    });
  });

  it("exposes a generator and a QuestionPlanner adapter", async () => {
    const complete = vi.fn(async () => JSON.stringify(plan));
    const client: OpenCodeClient = { complete };
    const generator = createOpenCodeQuestionGenerator(client);
    await expect(generator.plan(briefing)).resolves.toEqual({
      ...plan,
      targetMinutes: 40,
      sessionAnswerBudget: 10,
    });

    const planner = new OpenCodeQuestionPlanner(client);
    await planner.plan({
      opportunity: briefing.opportunity,
      attemptNumber: 2,
      usedQuestions: briefing.usedQuestions,
    });
    expect(complete).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sessionId: "question-plan:opp-2:attempt:2",
        messages: expect.arrayContaining([
          {
            role: "user",
            content: JSON.stringify({
              opportunity: briefing.opportunity,
              attemptNumber: 2,
              usedQuestions: briefing.usedQuestions,
              jobDescription: "",
              curriculum: "",
            }),
          },
        ]),
      }),
    );
  });

  it("builds a generator from env when no client is passed", async () => {
    vi.stubEnv("OPENCODE_API_KEY", "sk-env");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [{ message: { content: JSON.stringify(plan) } }],
            }),
            { status: 200 },
          ),
      ),
    );
    const generator = createOpenCodeQuestionGenerator();
    await expect(generator.plan(briefing)).resolves.toEqual({
      ...plan,
      targetMinutes: 40,
      sessionAnswerBudget: 10,
    });
  });
});
