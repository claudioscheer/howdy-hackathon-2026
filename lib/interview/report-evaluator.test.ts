import { describe, expect, it } from "vitest";
import { sessionReducer } from "./reducer";
import { ScriptedReportEvaluator } from "./report-evaluator";
import { createSeededSession } from "./seed";

function generatingState() {
  const started = sessionReducer(createSeededSession(), {
    type: "START_SESSION",
  });
  const ended = sessionReducer(started, {
    type: "END_SESSION",
    reason: "candidate_ended",
  });
  return ended;
}

describe("ScriptedReportEvaluator", () => {
  const evaluator = new ScriptedReportEvaluator();

  it("scores an early-ended session as insufficient evidence, not a low score", async () => {
    const state = generatingState();
    const report = await evaluator.evaluate({
      opportunity: state.opportunity,
      attemptNumber: state.attemptNumber,
      transcript: state.history,
      questions: state.questions,
      questionOutcomes: state.questionOutcomes,
    });
    expect(report).toMatchObject({
      attemptNumber: 1,
      summary: expect.stringContaining("insufficient evidence"),
    });
    const parsed = report as {
      dimensions: Record<string, { status: string; remainingUnknown?: string }>;
    };
    expect(parsed.dimensions.specificity.status).toBe("insufficient_evidence");
    expect(parsed.dimensions.specificity.remainingUnknown).toContain(
      "ended before",
    );
  });

  it("writes coaching copy when the candidate actually answered", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const report = await evaluator.evaluate({
      opportunity: started.opportunity,
      attemptNumber: 1,
      transcript: [
        ...started.history,
        {
          id: "a1",
          questionId: "question-collaboration",
          speaker: "candidate",
          kind: "answer",
          content:
            "I disagreed with a teammate on an API, I implemented tests, and reduced errors by 40 percent.",
        },
      ],
      questions: started.questions,
      questionOutcomes: [
        {
          questionId: "question-collaboration",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    });
    expect(report).toMatchObject({
      summary: expect.stringContaining("situation-action-result"),
    });
  });

  it("rejects malformed report input", async () => {
    await expect(evaluator.evaluate({ opportunity: {} })).rejects.toThrow(
      "invalid session",
    );
  });
});
