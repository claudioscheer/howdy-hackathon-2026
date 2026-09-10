import { describe, expect, it } from "vitest";
import { createSeededSession } from "./seed";
import { answerEvaluatorUserPayload } from "./evaluator-payload";

describe("answerEvaluatorUserPayload", () => {
  it("sends the latest answer and brief, not a raw session dump", () => {
    const seeded = createSeededSession();
    const question = seeded.questions[0];
    if (question === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const payload = JSON.parse(
      answerEvaluatorUserPayload({
        opportunity: seeded.opportunity,
        question: {
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
            maxFollowUps: 2,
            stopWhen: ["ownership is present"],
          },
        },
        answer: "I owned blah blah a row but it was a man.",
        history: [
          {
            id: "t1",
            questionId: question.id,
            speaker: "interviewer",
            kind: "question",
            content: question.prompt,
          },
        ],
      }),
    ) as {
      latestAnswer: string;
      brief: { competency: string };
      compiledAt: string;
      elapsedSeconds: number;
      transcript: Array<{ content: string }>;
      push: null;
    };
    expect(payload.latestAnswer).toContain("blah blah");
    expect(payload.brief.competency).toBe("ownership");
    expect(payload.elapsedSeconds).toBe(0);
    expect(payload.compiledAt.length).toBeGreaterThan(0);
    expect(payload.transcript).toHaveLength(1);
    expect(payload.push).toBeNull();
  });

  it("compiles the full transcript, clock, and remaining push budget", () => {
    const seeded = createSeededSession();
    const question = seeded.questions[0];
    if (question === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const payload = JSON.parse(
      answerEvaluatorUserPayload({
        opportunity: seeded.opportunity,
        question,
        answer: "That was enough, that was very specific.",
        history: [
          {
            id: "t1",
            questionId: question.id,
            speaker: "interviewer",
            kind: "question",
            content: question.prompt,
          },
          {
            id: "t2",
            questionId: question.id,
            speaker: "candidate",
            kind: "answer",
            content: "I owned blah blah.",
          },
          {
            id: "t3",
            questionId: question.id,
            speaker: "interviewer",
            kind: "follow_up",
            content: "What did you personally change?",
          },
        ],
        clock: {
          submittedAt: "2026-09-10T12:01:15.000Z",
          elapsedSeconds: 75,
        },
        push: {
          followUpsUsed: 1,
          followUpCap: 2,
          remainingFollowUps: 1,
          answersOnThisQuestion: 2,
          topicAnswerBudget: 3,
          sessionAnswersUsed: 2,
          sessionAnswerBudget: 10,
          remainingSessionAnswers: 8,
          importance: "core",
          timeBudgetMinutes: 8,
        },
      }),
    ) as {
      compiledAt: string;
      elapsedSeconds: number;
      transcript: unknown[];
      push: { remainingFollowUps: number };
    };
    expect(payload.compiledAt).toBe("2026-09-10T12:01:15.000Z");
    expect(payload.elapsedSeconds).toBe(75);
    expect(payload.transcript).toHaveLength(3);
    expect(payload.push.remainingFollowUps).toBe(1);
  });

  it("falls back to JSON when the evaluation input is malformed", () => {
    expect(answerEvaluatorUserPayload({ answer: "nope" })).toBe(
      JSON.stringify({ answer: "nope" }),
    );
  });
});
