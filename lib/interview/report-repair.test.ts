import { describe, expect, it } from "vitest";
import { SessionReportSchema } from "./contracts";
import { repairSessionReport } from "./report-repair";

const answer =
  "I disagreed with a teammate on an API, I implemented tests, and reduced errors by 40 percent.";

const transcript = [
  {
    id: "t1",
    questionId: "question-collaboration",
    speaker: "interviewer",
    kind: "question",
    content: "Tell me about a disagreement.",
  },
  {
    id: "t2",
    questionId: "question-collaboration",
    speaker: "candidate",
    kind: "answer",
    content: answer,
  },
];

function scored(quote: string, questionId = "question-collaboration") {
  return {
    status: "scored" as const,
    score: 4,
    summary: "The answers showed owned detail on the asked topic.",
    evidence: [
      {
        questionId,
        quote,
        supports: "The candidate named a personal action and result.",
      },
    ],
  };
}

function insufficient(remainingUnknown?: string) {
  return {
    status: "insufficient_evidence" as const,
    summary: "Not enough fundamentals evidence was collected.",
    evidence: [],
    ...(remainingUnknown === undefined ? {} : { remainingUnknown }),
  };
}

describe("repairSessionReport", () => {
  it("replaces ungrounded quotes with the candidate turn", () => {
    const repaired = repairSessionReport(
      {
        attemptNumber: 1,
        summary: "The scorecard is grounded in the answers given.",
        dimensions: {
          relevance: scored("I reversed write-through caching"),
          specificity: scored("40 percent"),
          fundamentals: insufficient("Ended before this competency."),
          structure: "skip",
        },
      },
      transcript,
    );
    const parsed = SessionReportSchema.safeParse(repaired);
    expect(parsed.success).toBe(false);
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: { evidence: [{ quote: answer }] },
        specificity: { evidence: [{ quote: "40 percent" }] },
        fundamentals: { remainingUnknown: "Ended before this competency." },
        structure: "skip",
      },
    });
  });

  it("fills missing remainingUnknown and skips non-objects", () => {
    expect(repairSessionReport("nope", transcript)).toBe("nope");
    expect(repairSessionReport({ summary: "x" }, transcript)).toEqual({
      summary: "x",
    });
    const repaired = repairSessionReport(
      {
        attemptNumber: 1,
        summary: "Ended early.",
        dimensions: {
          relevance: insufficient(""),
          specificity: insufficient("   "),
          fundamentals: {
            status: "insufficient_evidence",
            summary: "Not enough signal.",
          },
          structure: {
            status: "scored",
            score: 3,
            summary: "The answer was organized enough to follow.",
            evidence: "bad",
          },
        },
      },
      transcript,
    );
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: {
          remainingUnknown:
            "The session did not gather enough signal for this dimension.",
        },
        specificity: {
          remainingUnknown:
            "The session did not gather enough signal for this dimension.",
        },
        fundamentals: {
          remainingUnknown:
            "The session did not gather enough signal for this dimension.",
        },
        structure: { evidence: "bad" },
      },
    });
  });

  it("grounds quotes from matching questions and ignores interviewer turns", () => {
    const repaired = repairSessionReport(
      {
        attemptNumber: 1,
        summary: "Grounded.",
        dimensions: {
          relevance: {
            status: "scored",
            score: 4,
            summary: "The answers addressed the asked question.",
            evidence: [
              "skip",
              { supports: "The candidate named a result." },
              {
                questionId: "missing",
                quote: "invented",
                supports: "The candidate named a result.",
              },
            ],
          },
          specificity: scored(answer),
          fundamentals: scored(answer),
          structure: scored(answer),
        },
      },
      [
        "nope",
        ...transcript,
        { speaker: "candidate" },
        {
          speaker: "candidate",
          questionId: 1,
          content: "nope",
        },
        {
          speaker: "candidate",
          questionId: "q1",
          content: 3,
        },
        {
          speaker: "candidate",
          questionId: "q-empty",
          content: "   ",
        },
      ],
    );
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: {
          evidence: [
            "skip",
            { quote: answer, questionId: "question-collaboration" },
            { quote: answer, questionId: "question-collaboration" },
          ],
        },
      },
    });
  });

  it("keeps ungrounded quotes when the transcript has no candidate text", () => {
    const repaired = repairSessionReport(
      {
        attemptNumber: 1,
        summary: "No answers.",
        dimensions: {
          relevance: scored("invented"),
          specificity: scored("invented"),
          fundamentals: scored("invented"),
          structure: scored("invented"),
        },
      },
      "not-an-array",
    );
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: { evidence: [{ quote: "invented" }] },
      },
    });
  });

  it("uses whitespace-only candidate content when nothing else is available", () => {
    const repaired = repairSessionReport(
      {
        attemptNumber: 1,
        summary: "Thin transcript.",
        dimensions: {
          relevance: scored("invented", "q-empty"),
          specificity: scored("invented"),
          fundamentals: scored("invented"),
          structure: scored("invented"),
        },
      },
      [
        {
          speaker: "candidate",
          questionId: "q-empty",
          content: "   ",
        },
      ],
    );
    expect(repaired).toMatchObject({
      dimensions: {
        relevance: { evidence: [{ quote: "   ", questionId: "q-empty" }] },
      },
    });
  });
});
