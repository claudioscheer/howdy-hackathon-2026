import { describe, expect, it } from "vitest";
import { PlannedQuestionSpeaker, speakNewQuestion } from "./interviewer-ask";
import { sessionReducer } from "./reducer";
import { createSeededSession } from "./seed";
import type { SessionState } from "./session";

describe("speakNewQuestion", () => {
  it("replaces a newly asked planned prompt with live wording", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const spoken = await speakNewQuestion(started, {
      async speak() {
        return "Walk me through the last system you personally owned.";
      },
    });
    expect(spoken.history.at(-1)?.content).toContain("system you personally");
  });

  it("keeps the planned prompt when speaking is a no-op or fails", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const identity = await speakNewQuestion(
      started,
      new PlannedQuestionSpeaker(),
    );
    expect(identity.history.at(-1)?.content).toBe(
      started.history.at(-1)?.content,
    );
    const failed = await speakNewQuestion(started, {
      async speak() {
        throw new Error("offline");
      },
    });
    expect(failed).toBe(started);
    const empty = await speakNewQuestion(started, {
      async speak() {
        return "   ";
      },
    });
    expect(empty).toBe(started);
  });

  it("does not rewrite follow-ups or missing questions", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const followUp: SessionState = {
      ...started,
      history: [
        ...started.history,
        {
          id: "f1",
          questionId: started.questions[0]?.id ?? "q",
          speaker: "interviewer",
          kind: "follow_up",
          content: "What did you personally change?",
        },
      ],
    };
    const speaker = {
      async speak() {
        return "rewritten";
      },
    };
    expect(await speakNewQuestion(followUp, speaker)).toBe(followUp);
    expect(
      await speakNewQuestion({ ...started, questionIndex: 99 }, speaker),
    ).toMatchObject({ questionIndex: 99 });
    expect(
      await speakNewQuestion({ ...started, history: [] }, speaker),
    ).toMatchObject({ history: [] });
  });
});
