import { describe, expect, it } from "vitest";
import { createSeededSession } from "./seed";
import { reportEvaluatorUserPayload } from "./report-evaluator-payload";

describe("reportEvaluatorUserPayload", () => {
  it("sends role, outcomes, and transcript turns", () => {
    const seeded = createSeededSession();
    const question = seeded.questions[0];
    if (question === undefined) {
      throw new Error("The seed must contain a question.");
    }
    const payload = JSON.parse(
      reportEvaluatorUserPayload({
        opportunity: seeded.opportunity,
        attemptNumber: 2,
        questions: seeded.questions,
        questionOutcomes: [
          {
            questionId: question.id,
            appliedStopReason: "candidate_ended_early",
          },
        ],
        transcript: [
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
            content: "I implemented tests and reduced errors by 40 percent.",
          },
        ],
      }),
    ) as {
      role: string;
      attemptNumber: number;
      questions: Array<{ id: string }>;
      questionOutcomes: Array<{ appliedStopReason: string }>;
      transcript: Array<{ speaker: string; content: string }>;
    };
    expect(payload.role).toBe(seeded.opportunity.role);
    expect(payload.attemptNumber).toBe(2);
    expect(payload.questions[0]?.id).toBe(question.id);
    expect(payload.questionOutcomes[0]?.appliedStopReason).toBe(
      "candidate_ended_early",
    );
    expect(payload.transcript).toHaveLength(2);
    expect(payload.transcript[1]?.content).toContain("40 percent");
  });

  it("falls back to JSON when the report input is malformed", () => {
    expect(reportEvaluatorUserPayload({ transcript: [] })).toBe(
      JSON.stringify({ transcript: [] }),
    );
  });
});
