import { describe, expect, it } from "vitest";
import type { InterviewQuestion, TranscriptTurn } from "./contracts";
import {
  answersFor,
  hasScoreableDimensionSignal,
  unansweredFollowUp,
} from "./report-signal";

const question: InterviewQuestion = {
  id: "q-spec",
  prompt: "Tell me about a disagreement.",
  primaryDimension: "specificity",
};

function turn(
  speaker: TranscriptTurn["speaker"],
  kind: TranscriptTurn["kind"],
  content: string,
): TranscriptTurn {
  return {
    id: `${speaker}-${kind}`,
    questionId: "q-spec",
    speaker,
    kind,
    content,
  };
}

describe("report signal", () => {
  it("finds candidate answers for one question or the whole transcript", () => {
    const history = [
      turn("interviewer", "question", "What happened?"),
      turn("candidate", "answer", "We figured it out."),
    ];
    expect(answersFor(history)).toHaveLength(1);
    expect(answersFor(history, "q-spec")).toHaveLength(1);
    expect(answersFor(history, "other")).toHaveLength(0);
  });

  it("detects an unanswered interviewer follow-up", () => {
    expect(unansweredFollowUp([], "q-spec")).toBe(false);
    expect(
      unansweredFollowUp(
        [turn("interviewer", "question", "What happened?")],
        "q-spec",
      ),
    ).toBe(false);
    expect(
      unansweredFollowUp(
        [turn("candidate", "answer", "We figured it out.")],
        "q-spec",
      ),
    ).toBe(false);
    expect(
      unansweredFollowUp(
        [
          turn("candidate", "answer", "We figured it out."),
          turn("interviewer", "follow_up", "Can you be more specific?"),
        ],
        "q-spec",
      ),
    ).toBe(true);
  });

  it("does not score a dimension left on an unanswered follow-up", () => {
    const history = [
      turn("candidate", "answer", "We figured it out."),
      turn("interviewer", "follow_up", "Can you be more specific?"),
    ];
    expect(
      hasScoreableDimensionSignal("specificity", [question], history),
    ).toBe(false);
    expect(hasScoreableDimensionSignal("relevance", [question], history)).toBe(
      false,
    );
    expect(
      hasScoreableDimensionSignal(
        "specificity",
        [question],
        [turn("candidate", "answer", "I built retries and cut errors 20%.")],
      ),
    ).toBe(true);
  });
});
