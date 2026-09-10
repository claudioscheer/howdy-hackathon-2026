import { describe, expect, it } from "vitest";
import type { ReportEvaluator, SessionReport } from "./contracts";
import { sessionReducer } from "./reducer";
import { ScriptedReportEvaluator } from "./report-evaluator";
import { createSeededSession } from "./seed";
import { ScriptedAnswerEvaluator } from "./evaluator";
import {
  endInterview,
  finalizeSession,
  progressInterview,
} from "./session-report";

function generatingState() {
  const started = sessionReducer(createSeededSession(), {
    type: "START_SESSION",
  });
  return sessionReducer(started, {
    type: "END_SESSION",
    reason: "candidate_ended",
  });
}

const dimension = {
  status: "scored" as const,
  score: 3,
  summary: "Grounded.",
  evidence: [] as SessionReport["dimensions"]["relevance"]["evidence"],
};

function report(): SessionReport {
  return {
    attemptNumber: 1,
    summary: "A grounded attempt.",
    dimensions: {
      relevance: dimension,
      specificity: dimension,
      fundamentals: dimension,
      structure: dimension,
    },
  };
}

describe("finalizeSession", () => {
  it("writes a grounded report onto a generating session", async () => {
    const state = generatingState();
    const result = await finalizeSession(state, new ScriptedReportEvaluator());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.status).toBe("COMPLETE");
      expect(result.report.dimensions.specificity.status).toBe(
        "insufficient_evidence",
      );
    }
  });

  it("rejects the wrong status or an empty transcript", async () => {
    const evaluator = new ScriptedReportEvaluator();
    const planned = createSeededSession();
    const wrong = await finalizeSession(planned, evaluator);
    expect(wrong).toMatchObject({
      ok: false,
      error: "A report can only be generated after the interview ends.",
    });
    const empty = await finalizeSession(
      { ...planned, status: "GENERATING_REPORT", history: [] },
      evaluator,
    );
    expect(empty).toMatchObject({
      ok: false,
      error: "The session does not have a transcript to score.",
    });
  });

  it("preserves state when the report evaluator fails", async () => {
    const state = generatingState();
    const malformed: ReportEvaluator = {
      async evaluate() {
        return { summary: "bad" };
      },
    };
    const thrown: ReportEvaluator = {
      async evaluate() {
        throw new Error("offline");
      },
    };
    const ungrounded: ReportEvaluator = {
      async evaluate() {
        return {
          ...report(),
          dimensions: {
            ...report().dimensions,
            relevance: {
              ...dimension,
              evidence: [
                {
                  questionId: "question-collaboration",
                  quote: "this quote is not in the transcript",
                },
              ],
            },
          },
        };
      },
    };
    expect(await finalizeSession(state, malformed)).toMatchObject({
      ok: false,
      state,
      error: "The report evaluator returned an invalid report.",
    });
    expect(await finalizeSession(state, thrown)).toMatchObject({
      ok: false,
      error: "The report evaluator could not score the interview.",
    });
    expect(await finalizeSession(state, ungrounded)).toMatchObject({
      ok: false,
      error: "The report evaluator returned an invalid report.",
    });
  });

  it("finalizes automatically after the last question", async () => {
    const seeded = createSeededSession();
    const awaitingFinal = sessionReducer(
      {
        ...seeded,
        status: "PLANNED",
      },
      { type: "START_SESSION" },
    );
    const onLast: typeof awaitingFinal = {
      ...awaitingFinal,
      questionIndex: 2,
      history: [
        {
          id: "q3",
          questionId: "question-delivery",
          speaker: "interviewer",
          kind: "question",
          content: seeded.questions[2]?.prompt ?? "delivery",
        },
      ],
    };
    const result = await progressInterview(
      onLast,
      "I reduced delivery risk, I tested the rollout, and we shipped with 0 incidents in 14 days.",
      new ScriptedAnswerEvaluator(),
      new ScriptedReportEvaluator(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.status).toBe("COMPLETE");
      expect(result.state.report).toBeDefined();
    }
    const followed = await progressInterview(
      awaitingFinal,
      "I had a disagreement with a teammate but we figured it out.",
      new ScriptedAnswerEvaluator(),
      new ScriptedReportEvaluator(),
    );
    expect(followed.ok).toBe(true);
    if (followed.ok) {
      expect(followed.state.status).toBe("AWAITING_ANSWER");
    }
  });

  it("returns the rejected turn when the answer cannot be submitted", async () => {
    const planned = createSeededSession();
    const result = await progressInterview(
      planned,
      "A valid candidate answer",
      new ScriptedAnswerEvaluator(),
      new ScriptedReportEvaluator(),
    );
    expect(result.ok).toBe(false);
    expect(result.state).toEqual(planned);
  });

  it("lets a live speaker rephrase the next planned question", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const result = await progressInterview(
      started,
      "I disagreed with a teammate on an API migration, added TypeScript contract tests, and reduced partner errors by 42 percent.",
      new ScriptedAnswerEvaluator(),
      new ScriptedReportEvaluator(),
      {
        async speak() {
          return "What API tradeoff did you reverse after that disagreement?";
        },
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.history.at(-1)?.content).toContain("API tradeoff");
    }
  });

  it("ends the interview from the awaiting state and refuses other states", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const ended = await endInterview(started, new ScriptedReportEvaluator());
    expect(ended.ok).toBe(true);
    if (ended.ok) {
      expect(ended.state.status).toBe("COMPLETE");
      expect(ended.report.dimensions.specificity.status).toBe(
        "insufficient_evidence",
      );
    }
    const refused = await endInterview(
      createSeededSession(),
      new ScriptedReportEvaluator(),
    );
    expect(refused).toMatchObject({
      ok: false,
      error: "The interview can only be ended while waiting for an answer.",
    });
  });
});
