import { describe, expect, it } from "vitest";
import type {
  InterviewQuestion,
  QuestionOutcome,
  TranscriptTurn,
} from "./contracts";
import { quoteEvidence, scoreDimension } from "./report-score";

const question: InterviewQuestion = {
  id: "q-spec",
  prompt: "Tell me about a disagreement with a teammate.",
  primaryDimension: "specificity",
};

function answer(content: string): TranscriptTurn {
  return {
    id: "a1",
    questionId: "q-spec",
    speaker: "candidate",
    kind: "answer",
    content,
  };
}

describe("report dimension scoring", () => {
  it("builds no evidence when there is no candidate turn", () => {
    expect(quoteEvidence([], "unused")).toEqual([]);
  });

  it("marks a dimension unknown when the candidate never answered it", () => {
    const ended: QuestionOutcome = {
      questionId: "q-spec",
      appliedStopReason: "candidate_ended_early",
    };
    const dimension = scoreDimension("specificity", [question], [], [ended]);
    expect(dimension.status).toBe("insufficient_evidence");
    if (dimension.status === "insufficient_evidence") {
      expect(dimension.remainingUnknown).toContain("ended before");
    }
  });

  it("scores relevance, specificity, fundamentals, and structure from answers", () => {
    const strong = answer(
      "I disagreed with a teammate on an API, I implemented contract tests, and reduced errors by 42 percent.",
    );
    const history = [strong];
    const outcomes: QuestionOutcome[] = [
      {
        questionId: "q-spec",
        recommendedDecision: "MOVE_ON",
        recommendedStopReason: "evidence_sufficient",
        appliedStopReason: "evidence_sufficient",
      },
    ];

    expect(
      scoreDimension("relevance", [question], history, outcomes).status,
    ).toBe("scored");
    expect(
      scoreDimension("specificity", [question], history, outcomes).status,
    ).toBe("scored");
    expect(
      scoreDimension("fundamentals", [question], history, outcomes).status,
    ).toBe("scored");
    const structure = scoreDimension(
      "structure",
      [question],
      history,
      outcomes,
    );
    expect(structure.status).toBe("scored");
    if (structure.status === "scored") {
      expect(structure.score).toBeGreaterThanOrEqual(4);
      expect(structure.evidence[0]?.quote).toContain("disagreed");
    }
  });

  it("gives a modest structure score to longer unstructured answers", () => {
    const weak = scoreDimension(
      "structure",
      [question],
      [answer("We figured it out with a teammate after a long talk together.")],
      [
        {
          questionId: "q-spec",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(weak.status).toBe("scored");
    if (weak.status === "scored") {
      expect(weak.score).toBe(2);
    }
  });

  it("gives a low structure score to short unstructured answers", () => {
    const weak = scoreDimension(
      "structure",
      [question],
      [answer("We figured it out with a teammate.")],
      [
        {
          questionId: "q-spec",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(weak.status).toBe("scored");
    if (weak.status === "scored") {
      expect(weak.score).toBeLessThan(4);
      expect(weak.summary.toLowerCase()).toContain("situation");
    }
  });

  it("keeps leftover unknown material on a scored dimension", () => {
    const second: InterviewQuestion = {
      id: "q-spec-2",
      prompt: "Tell me about another disagreement with a teammate.",
      primaryDimension: "specificity",
    };
    const dimension = scoreDimension(
      "specificity",
      [question, second],
      [answer("I built a retry queue and reduced timeouts by 30 percent.")],
      [
        {
          questionId: "q-spec-2",
          appliedStopReason: "skipped_optional",
        },
      ],
    );
    expect(dimension.status).toBe("scored");
    if (dimension.status === "scored") {
      expect(dimension.remainingUnknown).toContain("Later topics");
    }
  });

  it("uses the generic unknown copy when a topic was skipped rather than ended", () => {
    const dimension = scoreDimension(
      "specificity",
      [question],
      [],
      [
        {
          questionId: "q-spec",
          appliedStopReason: "skipped_supporting",
        },
      ],
    );
    expect(dimension.status).toBe("insufficient_evidence");
    if (dimension.status === "insufficient_evidence") {
      expect(dimension.remainingUnknown).toContain("No candidate answers");
    }
  });

  it("scores empty-looking answers without fabricating a quote", () => {
    const dimension = scoreDimension(
      "structure",
      [question],
      [answer("   ")],
      [
        {
          questionId: "q-spec",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(dimension.status).toBe("scored");
    if (dimension.status === "scored") {
      expect(dimension.score).toBe(1);
      expect(dimension.evidence).toEqual([]);
    }
  });

  it("summarizes a mid-range score without calling it strong", () => {
    const dimension = scoreDimension(
      "specificity",
      [question],
      [answer("I implemented a cache after a teammate disagreement.")],
      [
        {
          questionId: "q-spec",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(dimension.status).toBe("scored");
    if (dimension.status === "scored") {
      expect(dimension.summary).toContain("some specificity");
    }
  });

  it("keeps a fundamentals score modest when no technical detail appears", () => {
    const later: InterviewQuestion = {
      id: "q-fund",
      prompt: "Describe an API design decision.",
      primaryDimension: "fundamentals",
    };
    const turn: TranscriptTurn = {
      id: "a-plain",
      questionId: "q-fund",
      speaker: "candidate",
      kind: "answer",
      content: "I talked with the group and we figured the design out.",
    };
    const dimension = scoreDimension(
      "fundamentals",
      [question, later],
      [turn],
      [
        {
          questionId: "q-fund",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(dimension.status).toBe("scored");
    if (dimension.status === "scored") {
      expect(dimension.score).toBe(2);
      expect(dimension.summary.toLowerCase()).toContain("weak");
    }
  });

  it("scores fundamentals from any on-topic technical answer", () => {
    const later: InterviewQuestion = {
      id: "q-fund",
      prompt: "Describe an API design decision.",
      primaryDimension: "fundamentals",
    };
    const turn: TranscriptTurn = {
      id: "a2",
      questionId: "q-fund",
      speaker: "candidate",
      kind: "answer",
      content: "I designed the API and added a postgres index.",
    };
    const dimension = scoreDimension(
      "fundamentals",
      [question, later],
      [turn],
      [
        {
          questionId: "q-fund",
          appliedStopReason: "evidence_sufficient",
        },
      ],
    );
    expect(dimension.status).toBe("scored");
  });

  it("treats unmatched answers as not relevant", () => {
    const turn: TranscriptTurn = {
      id: "a3",
      questionId: "missing",
      speaker: "candidate",
      kind: "answer",
      content: "I shipped a cache.",
    };
    const dimension = scoreDimension("relevance", [question], [turn], []);
    expect(dimension.status).toBe("scored");
    if (dimension.status === "scored") {
      expect(dimension.score).toBe(1);
    }
  });
});
