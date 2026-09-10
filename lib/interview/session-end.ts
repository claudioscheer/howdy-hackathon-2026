import type { InterviewQuestion, QuestionOutcome } from "./contracts";
import type { SessionState } from "./session";

function unusedQuestions(state: SessionState): InterviewQuestion[] {
  const recorded = new Set(
    state.questionOutcomes.map((outcome) => outcome.questionId),
  );
  return state.questions.filter(
    (question, index) =>
      index >= state.questionIndex && !recorded.has(question.id),
  );
}

function askedQuestion(state: SessionState): InterviewQuestion | undefined {
  const current = state.questions[state.questionIndex];
  if (current === undefined) {
    return undefined;
  }
  const asked = state.history.some((turn) => turn.questionId === current.id);
  return asked ? current : undefined;
}

function withUsedQuestion(
  state: SessionState,
  question: InterviewQuestion | undefined,
): Pick<SessionState, "usedQuestions"> {
  if (question === undefined) {
    return { usedQuestions: state.usedQuestions };
  }
  if (state.usedQuestions.some((used) => used.id === question.id)) {
    return { usedQuestions: state.usedQuestions };
  }
  return {
    usedQuestions: [
      ...state.usedQuestions,
      { id: question.id, prompt: question.prompt },
    ],
  };
}

function earlyOutcomes(questions: InterviewQuestion[]): QuestionOutcome[] {
  return questions.map((question) => ({
    questionId: question.id,
    appliedStopReason: "candidate_ended_early",
  }));
}

export function endSessionEarly(state: SessionState): SessionState {
  if (state.status !== "AWAITING_ANSWER") {
    return state;
  }
  const remaining = unusedQuestions(state);
  return {
    ...state,
    ...withUsedQuestion(state, askedQuestion(state)),
    status: "GENERATING_REPORT",
    questionOutcomes: [...state.questionOutcomes, ...earlyOutcomes(remaining)],
  };
}
