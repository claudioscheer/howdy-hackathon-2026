import { describe, expect, it, vi } from "vitest";
import {
  NEXT_QUESTION_SYSTEM_PROMPT,
  OpenCodeQuestionSpeaker,
  createOpenCodeQuestionSpeaker,
} from "./interviewer-ask-opencode";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { createSeededSession } from "./seed";
import { questionPlanSessionId } from "./planner";

vi.mock("./opencode-client", () => ({
  createOpenCodeClientFromEnv: () => ({
    complete: async () => JSON.stringify({ ask: "What did you own?" }),
  }),
}));

describe("OpenCodeQuestionSpeaker", () => {
  it("asks the model to phrase the next planned topic", async () => {
    const complete = vi.fn(async () =>
      JSON.stringify({
        ask: "What ownership did you take on the last service you shipped?",
      }),
    );
    const speaker = new OpenCodeQuestionSpeaker({ complete });
    const seeded = createSeededSession();
    const planned = seeded.questions[0];
    if (planned === undefined) {
      throw new Error("The seed must contain a question.");
    }
    await expect(
      speaker.speak({
        role: seeded.opportunity.role,
        opportunityId: seeded.opportunity.id,
        attemptNumber: seeded.attemptNumber,
        planned: {
          ...planned,
          brief: {
            competency: "ownership",
            roleRelevance: "The role needs owned examples.",
            importance: "core",
            expectedDepth: "A personal action and result.",
            evidenceToListenFor: ["owned action"],
            followUpTriggers: ["vague ownership"],
            timeBudgetMinutes: 8,
            answerBudget: 3,
            maxFollowUps: 2,
            stopWhen: ["ownership is present"],
          },
        },
        history: [
          {
            id: "t1",
            questionId: planned.id,
            speaker: "interviewer",
            kind: "question",
            content: planned.prompt,
          },
        ],
      }),
    ).resolves.toContain("ownership");
    await expect(
      speaker.speak({
        role: seeded.opportunity.role,
        opportunityId: seeded.opportunity.id,
        attemptNumber: seeded.attemptNumber,
        planned,
        history: [],
      }),
    ).resolves.toContain("ownership");
    expect(NEXT_QUESTION_SYSTEM_PROMPT).toContain("planned");
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[0]?.[0]?.sessionId).toBe(
      questionPlanSessionId(seeded.opportunity.id, seeded.attemptNumber),
    );
    expect(complete.mock.calls[0]?.[0]?.maxTokens).toBe(
      DEFAULT_MAX_COMPLETION_TOKENS,
    );
    expect(createOpenCodeQuestionSpeaker()).toBeInstanceOf(
      OpenCodeQuestionSpeaker,
    );
  });
});
