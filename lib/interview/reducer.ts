import type { InterviewQuestion } from "./contracts";
import {
  applyDecision,
  appendTurn,
  startPlannedSession,
} from "./session-transition";
import type { SessionEvent, SessionReducer, SessionState } from "./session";

function currentQuestion(state: SessionState): InterviewQuestion | undefined {
  return state.questions[state.questionIndex];
}

export const sessionReducer: SessionReducer = (
  state: SessionState,
  event: SessionEvent,
): SessionState => {
  const question = currentQuestion(state);

  switch (event.type) {
    case "START_SESSION":
      if (state.status !== "PLANNED") {
        return state;
      }
      return startPlannedSession(state);

    case "ANSWER_SUBMITTED":
      if (state.status !== "AWAITING_ANSWER" || question === undefined) {
        return state;
      }
      return {
        ...state,
        status: "EVALUATING_ANSWER",
        sessionAnswersUsed: state.sessionAnswersUsed + 1,
        questionAnswersUsed: state.questionAnswersUsed + 1,
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
