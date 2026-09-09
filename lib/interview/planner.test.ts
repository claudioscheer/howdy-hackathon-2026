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

const plan = {
  questions: [
    {
      id: "q-1",
      prompt: "Walk through a recent TypeScript change you owned.",
      primaryDimension: "specificity",
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

  it("asks OpenCode for a structured question plan", async () => {
    const complete = vi.fn(async () => JSON.stringify(plan));
    const client: OpenCodeClient = { complete };
    await expect(planQuestionsWithOpenCode(client, briefing)).resolves.toEqual(
      plan,
    );
    expect(complete).toHaveBeenCalledWith({
      sessionId: "question-plan:opp-2:attempt:1",
      json: true,
      messages: [
        {
          role: "system",
          content: expect.stringContaining("Propose exactly 3 questions"),
        },
        { role: "user", content: JSON.stringify(briefing) },
      ],
    });
  });

  it("exposes a generator and a QuestionPlanner adapter", async () => {
    const complete = vi.fn(async () => JSON.stringify(plan));
    const client: OpenCodeClient = { complete };
    const generator = createOpenCodeQuestionGenerator(client);
    await expect(generator.plan(briefing)).resolves.toEqual(plan);

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
    await expect(generator.plan(briefing)).resolves.toEqual(plan);
  });
});
