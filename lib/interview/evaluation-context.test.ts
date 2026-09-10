import { describe, expect, it } from "vitest";
import { evaluationClock, evaluationPush } from "./evaluation-context";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";

describe("evaluation context", () => {
  it("records the submission clock", () => {
    expect(evaluationClock({ elapsedSeconds: 75 }).elapsedSeconds).toBe(75);
    expect(evaluationClock({ elapsedSeconds: -4 }).elapsedSeconds).toBe(0);
    expect(
      evaluationClock({ submittedAt: "2026-09-10T12:00:00.000Z" }).submittedAt,
    ).toBe("2026-09-10T12:00:00.000Z");
    expect(evaluationClock().submittedAt.length).toBeGreaterThan(0);
  });

  it("counts how much the interviewer can still push on this topic", () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const question = started.questions[0];
    if (question === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const push = evaluationPush(started, question);
    expect(push.followUpsUsed).toBe(0);
    expect(push.remainingFollowUps).toBe(2);
    expect(push.followUpCap).toBe(2);
    expect(push.sessionAnswerBudget).toBe(started.sessionAnswerBudget);
    const briefed = evaluationPush(started, {
      ...question,
      brief: {
        competency: "ownership",
        roleRelevance: "The role needs owned examples.",
        importance: "core",
        expectedDepth: "A personal action and result.",
        evidenceToListenFor: ["owned action"],
        followUpTriggers: ["vague ownership"],
        timeBudgetMinutes: 8,
        answerBudget: 3,
        maxFollowUps: 1,
        stopWhen: ["ownership is present"],
      },
    });
    expect(briefed.followUpCap).toBe(1);
    expect(briefed.importance).toBe("core");
    expect(briefed.timeBudgetMinutes).toBe(8);
    expect(briefed.topicAnswerBudget).toBe(3);
  });
});
