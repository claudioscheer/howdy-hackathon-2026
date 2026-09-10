import type {
  InterviewQuestion,
  InterviewerDecision,
  QuestionOutcome,
} from "./contracts";
import type { AppliedStopReason } from "./judgment";
import { MAX_FOLLOW_UPS_PER_QUESTION, type SessionState } from "./session";

export const DEFAULT_TOPIC_ANSWER_BUDGET = 1 + MAX_FOLLOW_UPS_PER_QUESTION;

export function topicAnswerBudget(question: InterviewQuestion): number {
  return question.brief?.answerBudget ?? DEFAULT_TOPIC_ANSWER_BUDGET;
}

export function questionFollowUpCap(question: InterviewQuestion): number {
  const configured = question.brief?.maxFollowUps;
  if (configured === undefined) {
    return MAX_FOLLOW_UPS_PER_QUESTION;
  }
  return Math.min(MAX_FOLLOW_UPS_PER_QUESTION, configured);
}

export function reservedOpeningCount(state: SessionState): number {
  const remaining = state.questions.slice(state.questionIndex + 1);
  if (state.evaluationPath === "basic") {
    return remaining.length;
  }
  return remaining.filter((question) => question.brief?.importance === "core")
    .length;
}

export function followUpBlockedReason(
  state: SessionState,
): AppliedStopReason | undefined {
  const question = state.questions[state.questionIndex];
  if (
    question !== undefined &&
    state.followUpCount >= questionFollowUpCap(question)
  ) {
    return "follow_up_cap";
  }
  if (
    question !== undefined &&
    state.questionAnswersUsed >= topicAnswerBudget(question)
  ) {
    return "topic_budget_exhausted";
  }
  const remaining = state.sessionAnswerBudget - state.sessionAnswersUsed;
  if (remaining <= reservedOpeningCount(state)) {
    return "protect_remaining_core_or_close";
  }
  return undefined;
}

export function appliedStopReason(
  decision: InterviewerDecision,
  blocked: AppliedStopReason | undefined,
): AppliedStopReason {
  if (decision.decision === "MOVE_ON") {
    return decision.recommendedStopReason;
  }
  if (blocked === undefined) {
    return "follow_up_cap";
  }
  return blocked;
}

type LaterCounts = {
  cores: number;
  supporting: number;
};

function laterCounts(
  questions: InterviewQuestion[],
  index: number,
): LaterCounts {
  const remaining = questions.slice(index + 1);
  return {
    cores: remaining.filter((question) => question.brief?.importance === "core")
      .length,
    supporting: remaining.filter(
      (question) => question.brief?.importance === "supporting",
    ).length,
  };
}

export function shouldSkipQuestion(
  question: InterviewQuestion,
  evaluationPath: SessionState["evaluationPath"],
  remainingAnswers: number,
  later: LaterCounts,
): boolean {
  if (remainingAnswers <= 0) {
    return true;
  }
  if (evaluationPath === "basic" || question.brief === undefined) {
    return false;
  }
  if (question.brief.importance === "core") {
    return false;
  }
  if (question.brief.importance === "supporting") {
    return remainingAnswers <= later.cores;
  }
  return remainingAnswers <= later.cores + later.supporting;
}

export function askableQuestionIndex(
  state: SessionState,
  fromIndex: number,
): number | undefined {
  const remainingAnswers = state.sessionAnswerBudget - state.sessionAnswersUsed;
  for (let index = fromIndex; index < state.questions.length; index += 1) {
    const question = state.questions[index];
    if (question === undefined) {
      continue;
    }
    if (
      !shouldSkipQuestion(
        question,
        state.evaluationPath,
        remainingAnswers,
        laterCounts(state.questions, index),
      )
    ) {
      return index;
    }
  }
  return undefined;
}

export function firstAskableQuestionIndex(
  state: SessionState,
): number | undefined {
  return askableQuestionIndex(state, 0);
}

export function nextAskableQuestionIndex(
  state: SessionState,
): number | undefined {
  return askableQuestionIndex(state, state.questionIndex + 1);
}

export function skipOutcome(
  question: InterviewQuestion,
  remainingAnswers: number,
): QuestionOutcome {
  if (remainingAnswers <= 0) {
    return {
      questionId: question.id,
      appliedStopReason: "session_budget_exhausted",
    };
  }
  if (question.brief?.importance === "supporting") {
    return {
      questionId: question.id,
      appliedStopReason: "skipped_supporting",
    };
  }
  return {
    questionId: question.id,
    appliedStopReason: "skipped_optional",
  };
}

export function skippedQuestionOutcomes(
  questions: InterviewQuestion[],
  fromIndex: number,
  toIndex: number,
  remainingAnswers: number,
): QuestionOutcome[] {
  const outcomes: QuestionOutcome[] = [];
  for (let index = fromIndex; index < toIndex; index += 1) {
    const question = questions[index];
    if (question === undefined) {
      continue;
    }
    outcomes.push(skipOutcome(question, remainingAnswers));
  }
  return outcomes;
}
