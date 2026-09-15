import { describe, expect, it } from "vitest";
import type { InterviewQuestion, TranscriptTurn } from "./contracts";
import { applyReportScorePolicy } from "./report-policy";
import { EARLY_END_REPORT_SUMMARY } from "./report-signal";

const question: InterviewQuestion = {
  id: "q-spec",
  prompt: "Tell me about a disagreement.",
  primaryDimension: "specificity",
};

const answer: TranscriptTurn = {
  id: "a1",
  questionId: "q-spec",
  speaker: "candidate",
  kind: "answer",
  content: "I had a disagreement with a teammate but we figured it out.",
};

const followUp: TranscriptTurn = {
  id: "f1",
  questionId: "q-spec",
  speaker: "interviewer",
  kind: "follow_up",
  content: "Can you make that more specific?",
};

function scored(score: number) {
  return {
    status: "scored" as const,
    score,
    summary: "The answers were weak on specificity.",
    evidence: [
      {
        questionId: "q-spec",
        quote: answer.content,
        supports: "The candidate did not add a concrete result.",
      },
    ],
  };
}

function insufficient() {
  return {
    status: "insufficient_evidence" as const,
    summary: "Not enough evidence.",
    evidence: [],
    remainingUnknown: "The follow-up was never answered.",
  };
}

describe("applyReportScorePolicy", () => {
  it("does not rewrite the summary when the session was not ended early", () => {
    const repaired = applyReportScorePolicy(
      {
        attemptNumber: 1,
        summary: "No answers yet.",
        dimensions: {
          relevance: scored(1),
          specificity: scored(1),
          fundamentals: scored(1),
          structure: scored(1),
        },
      },
      {
        questions: [question],
        transcript: [followUp],
        questionOutcomes: [
          {
            questionId: "q-spec",
            appliedStopReason: "skipped_supporting",
          },
        ],
      },
    );
    expect(repaired).toMatchObject({ summary: "No answers yet." });
  });

  it("passes through malformed reports", () => {
    expect(
      applyReportScorePolicy("nope", {
        questions: [question],
        transcript: [answer],
        questionOutcomes: [],
      }),
    ).toBe("nope");
    expect(
      applyReportScorePolicy(
        { summary: "x" },
        {
          questions: [question],
          transcript: [answer],
          questionOutcomes: [],
        },
      ),
    ).toEqual({ summary: "x" });
  });

  it("turns an unanswered follow-up into insufficient evidence, not a 1", () => {
    const repaired = applyReportScorePolicy(
      {
        attemptNumber: 1,
        summary: "The candidate was vague.",
        dimensions: {
          relevance: scored(2),
          specificity: scored(1),
          fundamentals: scored(2),
          structure: scored(2),
        },
      },
      {
        questions: [question],
        transcript: [answer, followUp],
        questionOutcomes: [
          {
            questionId: "q-spec",
            appliedStopReason: "candidate_ended_early",
          },
        ],
      },
    );
    expect(repaired).toMatchObject({
      summary: EARLY_END_REPORT_SUMMARY,
      dimensions: {
        relevance: { status: "insufficient_evidence", evidence: [] },
        specificity: { status: "insufficient_evidence", evidence: [] },
        fundamentals: { status: "insufficient_evidence", evidence: [] },
        structure: { status: "insufficient_evidence", evidence: [] },
      },
    });
  });

  it("keeps a model score when the topic was completed", () => {
    const model = scored(4);
    const repaired = applyReportScorePolicy(
      {
        attemptNumber: 1,
        summary: "Strong enough.",
        dimensions: {
          relevance: model,
          specificity: model,
          fundamentals: insufficient(),
          structure: { status: "scored" },
        },
      },
      {
        questions: [question],
        transcript: [answer],
        questionOutcomes: [
          {
            questionId: "q-spec",
            appliedStopReason: "evidence_sufficient",
          },
        ],
      },
    );
    expect(repaired).toMatchObject({
      summary: "Strong enough.",
      dimensions: {
        specificity: { status: "scored", score: 4 },
      },
    });
  });

  it("keeps model remainingUnknown when forcing insufficient evidence", () => {
    const repaired = applyReportScorePolicy(
      {
        attemptNumber: 1,
        summary: "Ended early.",
        dimensions: {
          relevance: {
            status: "insufficient_evidence",
            summary: "Not enough relevance signal.",
            remainingUnknown: "The follow-up was never answered.",
          },
          specificity: scored(1),
          fundamentals: "skip",
          structure: {
            status: "insufficient_evidence",
            summary: "",
            remainingUnknown: "   ",
          },
        },
      },
      {
        questions: [question],
        transcript: [answer, followUp],
        questionOutcomes: [
          {
            questionId: "q-spec",
            appliedStopReason: "candidate_ended_early",
          },
        ],
      },
    );
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: {
          remainingUnknown: "The follow-up was never answered.",
        },
      },
    });
  });
});
