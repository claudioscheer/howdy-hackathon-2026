import { describe, expect, it, vi } from "vitest";
import {
  OpenCodeReportEvaluator,
  createOpenCodeReportEvaluator,
  reportSessionId,
} from "./report-evaluator-opencode";
import { DEFAULT_MAX_COMPLETION_TOKENS } from "./opencode-config";
import { createSeededSession } from "./seed";

vi.mock("./opencode-client", () => ({
  createOpenCodeClientFromEnv: () => ({
    complete: async () => JSON.stringify({ attemptNumber: 1 }),
  }),
}));

const answer =
  "I disagreed with a teammate on an API, I implemented tests, and reduced errors by 40 percent.";

function scored(quote: string) {
  return {
    status: "scored" as const,
    score: 4,
    summary: "The answers showed owned detail on the asked topic.",
    evidence: [
      {
        questionId: "question-collaboration",
        quote,
        supports: "The candidate named a personal action and result.",
      },
    ],
  };
}

function validReport(quote: string) {
  return {
    attemptNumber: 1,
    summary:
      "The scorecard is grounded in the answers given in this interview.",
    dimensions: {
      relevance: scored(quote),
      specificity: scored(quote),
      fundamentals: {
        status: "insufficient_evidence" as const,
        summary: "Not enough fundamentals evidence was collected.",
        evidence: [],
        remainingUnknown: "The candidate ended before this competency.",
      },
      structure: {
        status: "insufficient_evidence" as const,
        summary: "Not enough structure evidence was collected.",
        evidence: [],
        remainingUnknown: "The candidate ended before this competency.",
      },
    },
  };
}

describe("OpenCodeReportEvaluator", () => {
  it("asks the model for a grounded scorecard", async () => {
    const complete = vi.fn();
    complete
      .mockResolvedValueOnce(
        JSON.stringify(validReport("I reversed write-through caching")),
      )
      .mockResolvedValueOnce(
        JSON.stringify(validReport("I reversed write-through caching")),
      )
      .mockResolvedValueOnce(JSON.stringify({ attemptNumber: 1 }));
    const evaluator = new OpenCodeReportEvaluator({ complete });
    const seeded = createSeededSession();
    const input = {
      opportunity: seeded.opportunity,
      attemptNumber: seeded.attemptNumber,
      questions: seeded.questions,
      questionOutcomes: [
        {
          questionId: "question-collaboration",
          appliedStopReason: "candidate_ended_early" as const,
        },
      ],
      transcript: [
        {
          id: "t1",
          questionId: "question-collaboration",
          speaker: "candidate" as const,
          kind: "answer" as const,
          content: answer,
        },
      ],
    };
    const completedInput = {
      ...input,
      questionOutcomes: [
        {
          questionId: "question-collaboration",
          appliedStopReason: "evidence_sufficient" as const,
        },
      ],
    };
    await expect(evaluator.evaluate(completedInput)).resolves.toMatchObject({
      attemptNumber: 1,
      dimensions: {
        relevance: { status: "scored", evidence: [{ quote: answer }] },
      },
    });
    const unfinished = {
      ...input,
      transcript: [
        ...input.transcript,
        {
          id: "f1",
          questionId: "question-collaboration",
          speaker: "interviewer" as const,
          kind: "follow_up" as const,
          content: "Can you make that more specific?",
        },
      ],
    };
    await expect(evaluator.evaluate(unfinished)).resolves.toMatchObject({
      dimensions: {
        specificity: { status: "insufficient_evidence", evidence: [] },
      },
    });
    const liveCall = complete.mock.calls[0]?.[0];
    expect(liveCall?.sessionId).toBe(reportSessionId(input));
    expect(liveCall?.maxTokens).toBe(DEFAULT_MAX_COMPLETION_TOKENS);
    expect(liveCall?.json).toBe(true);
    expect(String(liveCall?.messages[1]?.content)).toContain("40 percent");
    await expect(evaluator.evaluate({ transcript: [] })).rejects.toThrow(
      "did not match the schema",
    );
    expect(complete.mock.calls[2]?.[0]?.sessionId).toBe("interview:report");
    expect(createOpenCodeReportEvaluator()).toBeInstanceOf(
      OpenCodeReportEvaluator,
    );
  });
});
