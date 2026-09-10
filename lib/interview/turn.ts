import {
  InterviewerDecisionSchema,
  type AnswerEvaluator,
  type InterviewerDecision,
} from "./contracts";
import { decisionEvidenceIsValid } from "./evidence";
import { sessionReducer } from "./reducer";
import {
  SessionEventSchema,
  type SessionEvent,
  type SessionState,
} from "./session";

export type SubmitAnswerResult =
  | {
      ok: true;
      state: SessionState;
      decision: InterviewerDecision;
    }
  | {
      ok: false;
      state: SessionState;
      error: string;
    };

export async function submitAnswer(
  state: SessionState,
  answer: string,
  evaluator: AnswerEvaluator,
): Promise<SubmitAnswerResult> {
  const submittedEvent = SessionEventSchema.safeParse({
    type: "ANSWER_SUBMITTED",
    answer,
  });
  if (!submittedEvent.success || state.status !== "AWAITING_ANSWER") {
    return {
      ok: false,
      state,
      error:
        "An answer can only be submitted while the session is awaiting one.",
    };
  }

  const answerEvent: SessionEvent = {
    type: "ANSWER_SUBMITTED",
    answer: answer.trim(),
  };

  const question = state.questions[state.questionIndex];
  if (question === undefined) {
    return {
      ok: false,
      state,
      error: "The session does not have a current question.",
    };
  }

  const evaluatingState = sessionReducer(state, answerEvent);

  try {
    const rawDecision = await evaluator.evaluate({
      opportunity: state.opportunity,
      question,
      answer: answerEvent.answer,
      history: evaluatingState.history,
    });
    const parsedDecision = InterviewerDecisionSchema.safeParse(rawDecision);
    if (
      !parsedDecision.success ||
      !decisionEvidenceIsValid(parsedDecision.data, evaluatingState.history)
    ) {
      return {
        ok: false,
        state,
        error: "The evaluator returned an invalid decision.",
      };
    }

    return {
      ok: true,
      state: sessionReducer(evaluatingState, {
        type: "ANSWER_EVALUATED",
        decision: parsedDecision.data,
      }),
      decision: parsedDecision.data,
    };
  } catch {
    return {
      ok: false,
      state,
      error: "The evaluator could not evaluate the answer.",
    };
  }
}
