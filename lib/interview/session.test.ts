import { describe, expect, it } from "vitest";
import { SessionEventSchema, SessionStateSchema } from "./session";

const state = {
  sessionId: "session-fictional-1",
  status: "PLANNED",
  candidate: { id: "candidate-1", displayName: "Alex Rivera" },
  opportunity: {
    id: "opportunity-1",
    role: "Senior Platform Engineer",
    seniority: "Senior",
    targetTechStack: ["TypeScript"],
    interviewType: "technical",
  },
  attemptNumber: 1,
  questions: [
    {
      id: "q-1",
      prompt: "Describe a recent incident.",
      primaryDimension: "specificity",
    },
  ],
  questionIndex: 0,
  followUpCount: 0,
  history: [],
  completedQuestionIds: [],
  usedQuestions: [],
};

describe("session state contract", () => {
  it("captures deterministic state-machine ownership", () => {
    expect(SessionStateSchema.safeParse(state).success).toBe(true);
    expect(
      SessionStateSchema.safeParse({ ...state, followUpCount: 3 }).success,
    ).toBe(false);
    expect(
      SessionStateSchema.safeParse({ ...state, attemptNumber: 4 }).success,
    ).toBe(false);
  });

  it("defines the reducer event boundary", () => {
    expect(
      SessionEventSchema.safeParse({ type: "START_SESSION" }).success,
    ).toBe(true);
    expect(
      SessionEventSchema.safeParse({
        type: "ANSWER_SUBMITTED",
        answer: "   ",
      }).success,
    ).toBe(false);
    expect(
      SessionEventSchema.safeParse({
        type: "ANSWER_EVALUATED",
        decision: {
          decision: "MOVE_ON",
          reason: "The answer is sufficiently specific.",
        },
      }).success,
    ).toBe(true);
  });
});
