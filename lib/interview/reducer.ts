import type {
  InterviewQuestion,
  InterviewerDecision,
  TranscriptTurn,
} from "./contracts";
import {
  MAX_FOLLOW_UPS_PER_QUESTION,
  type SessionEvent,
  type SessionReducer,
  type SessionState,
} from "./session";

function currentQuestion(state: SessionState): InterviewQuestion | undefined {
  return state.questions[state.questionIndex];
}

function appendTurn(
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

function advanceQuestion(
  state: SessionState,
  question: InterviewQuestion,
): SessionState {
  const remembered = rememberQuestion(state, question);
  const nextQuestion = state.questions[state.questionIndex + 1];

  if (nextQuestion === undefined) {
    return {
      ...state,
      ...remembered,
      status: "COMPLETE",
      followUpCount: 0,
    };
  }

  return {
    ...state,
    ...remembered,
    status: "AWAITING_ANSWER",
    questionIndex: state.questionIndex + 1,
    followUpCount: 0,
    history: appendTurn(state, {
      questionId: nextQuestion.id,
      speaker: "interviewer",
      kind: "question",
      content: nextQuestion.prompt,
    }),
  };
}

function applyDecision(
  state: SessionState,
  question: InterviewQuestion,
  decision: InterviewerDecision,
): SessionState {
  if (
    decision.decision === "FOLLOW_UP" &&
    state.followUpCount < MAX_FOLLOW_UPS_PER_QUESTION
  ) {
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

  return advanceQuestion(state, question);
}

export const sessionReducer: SessionReducer = (
  state: SessionState,
  event: SessionEvent,
): SessionState => {
  const question = currentQuestion(state);

  switch (event.type) {
    case "START_SESSION":
      if (state.status !== "PLANNED" || question === undefined) {
        return state;
      }
      return {
        ...state,
        status: "AWAITING_ANSWER",
        history: appendTurn(state, {
          questionId: question.id,
          speaker: "interviewer",
          kind: "question",
          content: question.prompt,
        }),
      };

    case "ANSWER_SUBMITTED":
      if (state.status !== "AWAITING_ANSWER" || question === undefined) {
        return state;
      }
      return {
        ...state,
        status: "EVALUATING_ANSWER",
        history: appendTurn(state, {
          questionId: question.id,
          speaker: "candidate",
          kind: "answer",
          content: event.answer,
        }),
      };

    case "ANSWER_EVALUATED":
      if (state.status !== "EVALUATING_ANSWER" || question === undefined) {
        return state;
      }
      return applyDecision(state, question, event.decision);

    case "REPORT_GENERATED":
      if (state.status !== "GENERATING_REPORT") {
        return state;
      }
      return { ...state, status: "COMPLETE", report: event.report };
  }
};
