import { describe, expect, it } from "vitest";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";
import { startPlannedSession } from "./session-transition";
import type { SessionState } from "./session";
import type { InterviewerBrief } from "./brief";

function brief(importance: InterviewerBrief["importance"]): InterviewerBrief {
  return {
    competency: importance,
    roleRelevance: "Role relevant.",
    importance,
    expectedDepth: "Owned example.",
    evidenceToListenFor: ["ownership"],
    followUpTriggers: ["missing ownership"],
    timeBudgetMinutes: 8,
    answerBudget: 3,
    maxFollowUps: 2,
    stopWhen: ["ownership is present"],
  };
}

describe("session transitions", () => {
  it("completes immediately when no question can be opened", () => {
    const seeded = createSeededSession();
    const exhausted: SessionState = {
      ...seeded,
      evaluationPath: "briefed",
      sessionAnswerBudget: 2,
      sessionAnswersUsed: 2,
      questions: seeded.questions.map((question) => ({
        ...question,
        brief: brief("core"),
      })),
    };
    const started = startPlannedSession(exhausted);
    expect(started.status).toBe("COMPLETE");
    expect(started.questionOutcomes).toHaveLength(3);
    expect(started.questionOutcomes[0]?.appliedStopReason).toBe(
      "session_budget_exhausted",
    );
    expect(sessionReducer(exhausted, { type: "START_SESSION" }).status).toBe(
      "COMPLETE",
    );
  });
});
