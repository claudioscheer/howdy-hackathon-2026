import type {
  InterviewQuestion,
  RubricDimension,
  TranscriptTurn,
} from "./contracts";
import { candidateTurns } from "./evidence";

export const EARLY_END_REPORT_SUMMARY =
  "The interview ended before every core topic was assessed. Remaining competencies are insufficient evidence, not a low score.";

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

export function unansweredFollowUp(
  history: TranscriptTurn[],
  questionId: string,
): boolean {
  const last = history.filter((turn) => turn.questionId === questionId).at(-1);
  return (
    last !== undefined &&
    last.speaker === "interviewer" &&
    last.kind === "follow_up"
  );
}

export function hasScoreableDimensionSignal(
  dimension: RubricDimension,
  questions: InterviewQuestion[],
  history: TranscriptTurn[],
): boolean {
  const primary = questions.filter(
    (question) => question.primaryDimension === dimension,
  );
  const inScope = primary.length > 0 ? primary : questions;
  return inScope.some((question) => {
    if (answersFor(history, question.id).length === 0) {
      return false;
    }
    return !unansweredFollowUp(history, question.id);
  });
}
