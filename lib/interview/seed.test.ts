import { describe, expect, it } from "vitest";
import {
  createSeededSession,
  SEEDED_QUESTION_PLAN,
  SEEDED_SESSION_ID,
} from "./seed";
import { SessionStateSchema } from "./session";

describe("seeded practice session", () => {
  it("creates the canonical fictional planned session", () => {
    const state = createSeededSession();

    expect(state.sessionId).toBe(SEEDED_SESSION_ID);
    expect(state.status).toBe("PLANNED");
    expect(state.attemptNumber).toBe(1);
    expect(state.questions).toHaveLength(3);
    expect(state.history).toEqual([]);
    expect(SessionStateSchema.safeParse(state).success).toBe(true);
  });

  it("accepts a route identity and returns a fresh question plan", () => {
    const first = createSeededSession("shared-session");
    const second = createSeededSession("another-session");

    expect(first.sessionId).toBe("shared-session");
    expect(first.questions).toEqual(SEEDED_QUESTION_PLAN);
    expect(first.questions).not.toBe(second.questions);
    expect(first.questions[0]).not.toBe(second.questions[0]);
  });
});
