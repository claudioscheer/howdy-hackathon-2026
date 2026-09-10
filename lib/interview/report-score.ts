import type {
  InterviewQuestion,
  QuestionOutcome,
  ReportDimension,
  ReportEvidence,
  RubricDimension,
  TranscriptTurn,
} from "./contracts";
import { candidateTurns } from "./evidence";
import { answersQuestion } from "./relevance";

const OWNED_ACTION_RE =
  /\b(?:i|we)\s+(?:built|changed|created|debugged|deployed|designed|implemented|introduced|investigated|led|measured|migrated|refactored|removed|resolved|tested|traced|used)\b/i;
const MEASURABLE_RE =
  /\b(?:\d+(?:\.\d+)?%?|p\d{2}|milliseconds?|ms|seconds?|minutes?|hours?|days?|weeks?)\b/i;
const TECHNICAL_DETAIL_RE =
  /\b(?:api|cache|database|deployment|index|javascript|kafka|latency|logging|metric|node(?:\.js)?|postgres(?:ql)?|query|react|schema|service|test|typescript)\b/i;
const OUTCOME_RE =
  /\b(?:cut|decreased|delivered|improved|increased|prevented|reduced|resolved|saved|shipped)\b/i;

export const REPORT_DIMENSIONS: RubricDimension[] = [
  "relevance",
  "specificity",
  "fundamentals",
  "structure",
];

function wordCount(answer: string): number {
  return answer.trim().split(/\s+/).filter(Boolean).length;
}

function signalCount(answer: string): number {
  const patterns = [
    OWNED_ACTION_RE,
    MEASURABLE_RE,
    TECHNICAL_DETAIL_RE,
    OUTCOME_RE,
  ];
  return patterns.filter((pattern) => pattern.test(answer)).length;
}

export function answersFor(
  history: TranscriptTurn[],
  questionId?: string,
): TranscriptTurn[] {
  const turns = candidateTurns(history);
  if (questionId === undefined) {
    return turns;
  }
  return turns.filter((turn) => turn.questionId === questionId);
}

export function quoteEvidence(
  turns: TranscriptTurn[],
  supports: string,
): ReportEvidence[] {
  const lead = turns[0];
  if (lead === undefined) {
    return [];
  }
  const quote = lead.content.trim();
  if (quote.length === 0) {
    return [];
  }
  return [{ questionId: lead.questionId, quote, supports }];
}

export function unassessedReasons(outcomes: QuestionOutcome[]): string[] {
  return outcomes
    .filter(
      (outcome) =>
        outcome.appliedStopReason === "candidate_ended_early" ||
        outcome.appliedStopReason === "skipped_optional" ||
        outcome.appliedStopReason === "skipped_supporting" ||
        outcome.appliedStopReason === "session_budget_exhausted",
    )
    .map((outcome) => outcome.appliedStopReason);
}

function clampScore(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function scoreDimension(
  dimension: RubricDimension,
  questions: InterviewQuestion[],
  history: TranscriptTurn[],
  outcomes: QuestionOutcome[],
): ReportDimension {
  const answers = answersFor(history);
  const primary = questions.filter(
    (question) => question.primaryDimension === dimension,
  );
  const primaryAnswers = primary.flatMap((question) =>
    answersFor(history, question.id),
  );
  const leftover = unassessedReasons(
    outcomes.filter((outcome) =>
      primary.some((question) => question.id === outcome.questionId),
    ),
  );
  if (
    answers.length === 0 ||
    (primary.length > 0 && primaryAnswers.length === 0)
  ) {
    return insufficient(dimension, leftover);
  }
  return scored(dimension, questions, answers, leftover);
}

function insufficient(
  dimension: RubricDimension,
  leftover: string[],
): ReportDimension {
  const endedEarly = leftover.includes("candidate_ended_early");
  return {
    status: "insufficient_evidence",
    summary: `Not enough ${dimension} evidence was collected to score this dimension.`,
    evidence: [],
    remainingUnknown: endedEarly
      ? "The candidate ended before this competency could be assessed."
      : `No candidate answers were collected for ${dimension}.`,
  };
}

function scored(
  dimension: RubricDimension,
  questions: InterviewQuestion[],
  answers: TranscriptTurn[],
  leftover: string[],
): ReportDimension {
  const score = clampScore(dimensionScore(dimension, questions, answers));
  const remainingUnknown =
    leftover.length > 0
      ? "Later topics ended before more evidence could be collected."
      : undefined;
  return {
    status: "scored",
    score,
    summary: dimensionSummary(dimension, score),
    evidence: quoteEvidence(answers, dimensionSupport(dimension, score)),
    remainingUnknown,
  };
}

function dimensionScore(
  dimension: RubricDimension,
  questions: InterviewQuestion[],
  answers: TranscriptTurn[],
): number {
  if (dimension === "relevance") {
    const hits = answers.filter((turn) => {
      const question = questions.find((item) => item.id === turn.questionId);
      if (question === undefined) {
        return false;
      }
      return answersQuestion(question.prompt, turn.content, {
        brief: question.brief,
        history: [],
      });
    }).length;
    return 1 + (hits / answers.length) * 4;
  }
  if (dimension === "specificity") {
    const average =
      answers.reduce((sum, turn) => sum + signalCount(turn.content), 0) /
      answers.length;
    return 1 + average;
  }
  if (dimension === "fundamentals") {
    const hits = answers.filter((turn) =>
      TECHNICAL_DETAIL_RE.test(turn.content),
    ).length;
    return hits === 0 ? 2 : 2 + (hits / answers.length) * 3;
  }
  const structured = answers.filter((turn) => {
    return (
      wordCount(turn.content) >= 12 &&
      OWNED_ACTION_RE.test(turn.content) &&
      OUTCOME_RE.test(turn.content)
    );
  }).length;
  if (structured === 0) {
    return wordCount(answers.map((turn) => turn.content).join(" ")) >= 8
      ? 2
      : 1;
  }
  return 3 + (structured / answers.length) * 2;
}

function dimensionSummary(dimension: RubricDimension, score: number): string {
  if (score >= 4) {
    return `The answers showed clear ${dimension} with concrete detail.`;
  }
  if (score === 3) {
    return `The answers showed some ${dimension}, but needed a clearer example.`;
  }
  return `The answers were weak on ${dimension}. Describe the situation, your action, and the result.`;
}

function dimensionSupport(dimension: RubricDimension, score: number): string {
  if (score >= 4) {
    return `This excerpt supports a stronger ${dimension} rating.`;
  }
  return `This excerpt is the available ${dimension} evidence from the transcript.`;
}
