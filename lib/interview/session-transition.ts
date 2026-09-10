import type {
  InterviewQuestion,
  InterviewerDecision,
  QuestionOutcome,
  TranscriptTurn,
} from "./contracts";
import {
  appliedStopReason,
  firstAskableQuestionIndex,
  followUpBlockedReason,
  nextAskableQuestionIndex,
  skippedQuestionOutcomes,
} from "./session-policy";
import type { SessionState } from "./session";

export function appendTurn(
  state: SessionState,
  turn: Omit<TranscriptTurn, "id">,
): TranscriptTurn[] {
  return [
    ...state.history,
    {
      ...turn,
      id: `${state.sessionId}-turn-${state.history.length + 1}`,
    },
  ];
}

function rememberQuestion(
  state: SessionState,
  question: InterviewQuestion,
): Pick<SessionState, "completedQuestionIds" | "usedQuestions"> {
  return {
    completedQuestionIds: state.completedQuestionIds.includes(question.id)
      ? state.completedQuestionIds
      : [...state.completedQuestionIds, question.id],
    usedQuestions: state.usedQuestions.some((used) => used.id === question.id)
      ? state.usedQuestions
      : [...state.usedQuestions, { id: question.id, prompt: question.prompt }],
  };
}

function recordOutcome(
  state: SessionState,
  question: InterviewQuestion,
  decision: InterviewerDecision,
  blocked: ReturnType<typeof followUpBlockedReason>,
): QuestionOutcome[] {
  return [
    ...state.questionOutcomes,
    {
      questionId: question.id,
      recommendedDecision: decision.decision,
      recommendedStopReason:
        decision.decision === "MOVE_ON"
          ? decision.recommendedStopReason
          : undefined,
      appliedStopReason: appliedStopReason(decision, blocked),
    },
  ];
}

function remainingAnswers(state: SessionState): number {
  return state.sessionAnswerBudget - state.sessionAnswersUsed;
}

function withSkippedOutcomes(
  state: SessionState,
  fromIndex: number,
  toIndex: number,
  base: QuestionOutcome[],
): QuestionOutcome[] {
  return [
    ...base,
    ...skippedQuestionOutcomes(
      state.questions,
      fromIndex,
      toIndex,
      remainingAnswers(state),
    ),
  ];
}

export function startPlannedSession(state: SessionState): SessionState {
  const firstIndex = firstAskableQuestionIndex(state);
  const firstQuestion =
    firstIndex === undefined ? undefined : state.questions[firstIndex];
  if (firstIndex === undefined || firstQuestion === undefined) {
    return {
      ...state,
      status: "COMPLETE",
      questionOutcomes: withSkippedOutcomes(
        state,
        0,
        state.questions.length,
        state.questionOutcomes,
      ),
    };
  }
  return {
    ...state,
    status: "AWAITING_ANSWER",
    questionIndex: firstIndex,
    questionOutcomes: withSkippedOutcomes(
      state,
      0,
      firstIndex,
      state.questionOutcomes,
    ),
    history: appendTurn(state, {
      questionId: firstQuestion.id,
      speaker: "interviewer",
      kind: "question",
      content: firstQuestion.prompt,
    }),
  };
}

export function applyDecision(
  state: SessionState,
  question: InterviewQuestion,
  decision: InterviewerDecision,
): SessionState {
  const blocked = followUpBlockedReason(state);
  if (decision.decision === "FOLLOW_UP" && blocked === undefined) {
    return {
      ...state,
      status: "AWAITING_ANSWER",
      followUpCount: state.followUpCount + 1,
      history: appendTurn(state, {
        questionId: question.id,
        speaker: "interviewer",
        kind: "follow_up",
        content: decision.followUp,
      }),
    };
  }
  return advanceQuestion(state, question, decision, blocked);
}

function advanceQuestion(
  state: SessionState,
  question: InterviewQuestion,
  decision: InterviewerDecision,
  blocked: ReturnType<typeof followUpBlockedReason>,
): SessionState {
  const remembered = rememberQuestion(state, question);
  const nextIndex = nextAskableQuestionIndex(state);
  const nextQuestion =
    nextIndex === undefined ? undefined : state.questions[nextIndex];
  const advanced = {
    ...state,
    ...remembered,
    followUpCount: 0,
    questionAnswersUsed: 0,
    questionOutcomes: withSkippedOutcomes(
      state,
      state.questionIndex + 1,
      nextIndex ?? state.questions.length,
      recordOutcome(state, question, decision, blocked),
    ),
  };
  if (nextQuestion === undefined || nextIndex === undefined) {
    return { ...advanced, status: "GENERATING_REPORT" };
  }
  return {
    ...advanced,
    status: "AWAITING_ANSWER",
    questionIndex: nextIndex,
    history: appendTurn(state, {
      questionId: nextQuestion.id,
      speaker: "interviewer",
      kind: "question",
      content: nextQuestion.prompt,
    }),
  };
}
