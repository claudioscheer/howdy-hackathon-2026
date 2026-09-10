import { describe, expect, it } from "vitest";
import {
  candidateTranscript,
  decisionEvidenceIsValid,
  distinctCandidateTurnCount,
} from "./evidence";
import type { TranscriptTurn } from "./contracts";

const interviewerQuestion: TranscriptTurn = {
  id: "t1",
  questionId: "q1",
  speaker: "interviewer",
  kind: "question",
  content:
    "Tell me about a time you worked through a difficult technical disagreement with a teammate.",
};

const candidateUnknown: TranscriptTurn = {
  id: "t2",
  questionId: "q1",
  speaker: "candidate",
  kind: "answer",
  content: "I do not know",
};

describe("decision evidence provenance", () => {
  it("builds a candidate-only transcript", () => {
    expect(candidateTranscript([interviewerQuestion, candidateUnknown])).toBe(
      "I do not know",
    );
  });

  it("rejects interviewer wording quoted as candidate evidence", () => {
    expect(
      decisionEvidenceIsValid(
        {
          decision: "MOVE_ON",
          reason: "The evaluator claimed enough evidence.",
          recommendedStopReason: "evidence_sufficient",
          evidence: [
            {
              quote: interviewerQuestion.content,
              supports: "The quoted text is the interviewer question.",
            },
          ],
        },
        [interviewerQuestion, candidateUnknown],
      ),
    ).toBe(false);
  });

  it("rejects a quote that only exists across joined candidate turns", () => {
    const first: TranscriptTurn = {
      id: "c1",
      questionId: "q1",
      speaker: "candidate",
      kind: "answer",
      content: "I do",
    };
    const second: TranscriptTurn = {
      id: "c2",
      questionId: "q1",
      speaker: "candidate",
      kind: "answer",
      content: "not know",
    };
    expect(
      decisionEvidenceIsValid(
        {
          decision: "MOVE_ON",
          reason: "The evaluator joined two turns into one quote.",
          recommendedStopReason: "evidence_sufficient",
          evidence: [
            {
              quote: "I do\nnot know",
              supports: "The quote is stitched from two answers.",
            },
          ],
        },
        [interviewerQuestion, first, second],
      ),
    ).toBe(false);
  });

  it("accepts a quote that appears in a candidate turn", () => {
    expect(
      decisionEvidenceIsValid(
        {
          decision: "FOLLOW_UP",
          reason: "The answer does not address the question.",
          dimension: "relevance",
          followUp: "How does that relate to a disagreement?",
          probePurpose: "relevance",
          unresolvedGap: "The candidate has not answered the asked question.",
          evidence: [
            {
              quote: "I do not know",
              supports: "The candidate did not supply a situation.",
            },
          ],
        },
        [interviewerQuestion, candidateUnknown],
      ),
    ).toBe(true);
  });

  it("requires contradiction evidence from two distinct candidate turns", () => {
    const first: TranscriptTurn = {
      id: "c1",
      questionId: "q1",
      speaker: "candidate",
      kind: "answer",
      content: "We added caching",
    };
    const second: TranscriptTurn = {
      id: "c2",
      questionId: "q1",
      speaker: "candidate",
      kind: "answer",
      content: "We never changed the data path",
    };
    const evidence = [
      {
        quote: "We added caching",
        supports: "The first turn claims caching fixed latency.",
      },
      {
        quote: "We never changed the data path",
        supports: "The later turn denies a data-path change.",
      },
    ];
    expect(distinctCandidateTurnCount(evidence, [first, second])).toBe(2);
    expect(
      distinctCandidateTurnCount(
        [{ quote: "missing", supports: "Not in the transcript." }],
        [first],
      ),
    ).toBe(0);
    expect(
      decisionEvidenceIsValid(
        {
          decision: "FOLLOW_UP",
          reason: "The answers contradict each other.",
          dimension: "specificity",
          followUp: "Which of those two statements is accurate?",
          probePurpose: "contradiction",
          unresolvedGap: "The two answers cannot both be true.",
          evidence,
        },
        [interviewerQuestion, first],
      ),
    ).toBe(false);
    expect(
      decisionEvidenceIsValid(
        {
          decision: "FOLLOW_UP",
          reason: "The answers contradict each other.",
          dimension: "specificity",
          followUp: "Which of those two statements is accurate?",
          probePurpose: "contradiction",
          unresolvedGap: "The two answers cannot both be true.",
          evidence,
        },
        [interviewerQuestion, first, second],
      ),
    ).toBe(true);
  });

  it("does not treat a distinct supports string as proof the quote justifies the judgment", () => {
    const supports = "The quote is enough evidence to move on.";
    expect(supports.includes(candidateUnknown.content)).toBe(false);
    expect(
      decisionEvidenceIsValid(
        {
          decision: "MOVE_ON",
          reason: "Claimed sufficient evidence from a non-answer.",
          recommendedStopReason: "evidence_sufficient",
          evidence: [
            {
              quote: "I do not know",
              supports,
            },
          ],
        },
        [interviewerQuestion, candidateUnknown],
      ),
    ).toBe(true);
  });
});
