import {
  SessionReportSchema,
  type AnswerEvaluator,
  type ReportEvaluator,
  type SessionReport,
} from "./contracts";
import { reportQuotesAreGrounded } from "./evidence";
import {
  PlannedQuestionSpeaker,
  speakNewQuestion,
  type QuestionSpeaker,
} from "./interviewer-ask";
import { sessionReducer } from "./reducer";
import type { SessionState } from "./session";
import { submitAnswer, type SubmitAnswerResult } from "./turn";
import type { AnswerClockInput } from "./evaluation-context";

export type FinalizeSessionResult =
  | { ok: true; state: SessionState; report: SessionReport }
  | { ok: false; state: SessionState; error: string };

function reportQuotes(report: SessionReport): string[] {
  return Object.values(report.dimensions).flatMap((dimension) =>
    dimension.evidence.map((item) => item.quote),
  );
}

export async function finalizeSession(
  state: SessionState,
  evaluator: ReportEvaluator,
): Promise<FinalizeSessionResult> {
  if (state.status !== "GENERATING_REPORT") {
    return {
      ok: false,
      state,
      error: "A report can only be generated after the interview ends.",
    };
  }
  if (state.history.length === 0) {
    return {
      ok: false,
      state,
      error: "The session does not have a transcript to score.",
    };
  }

  try {
    const rawReport = await evaluator.evaluate({
      opportunity: state.opportunity,
      attemptNumber: state.attemptNumber,
      transcript: state.history,
      questions: state.questions,
      questionOutcomes: state.questionOutcomes,
    });
    const parsed = SessionReportSchema.safeParse(rawReport);
    if (
      !parsed.success ||
      !reportQuotesAreGrounded(reportQuotes(parsed.data), state.history)
    ) {
      return {
        ok: false,
        state,
        error: "The report evaluator returned an invalid report.",
      };
    }
    return {
      ok: true,
      report: parsed.data,
      state: sessionReducer(state, {
        type: "REPORT_GENERATED",
        report: parsed.data,
      }),
    };
  } catch {
    return {
      ok: false,
      state,
      error: "The report evaluator could not score the interview.",
    };
  }
}

export async function progressInterview(
  state: SessionState,
  answer: string,
  answerEvaluator: AnswerEvaluator,
  reportEvaluator: ReportEvaluator,
  speaker: QuestionSpeaker = new PlannedQuestionSpeaker(),
  clock: AnswerClockInput = {},
): Promise<SubmitAnswerResult | FinalizeSessionResult> {
  const submitted = await submitAnswer(state, answer, answerEvaluator, clock);
  if (!submitted.ok) {
    return submitted;
  }
  const spoken = {
    ...submitted,
    state: await speakNewQuestion(submitted.state, speaker),
  };
  if (spoken.state.status !== "GENERATING_REPORT") {
    return spoken;
  }
  return finalizeSession(spoken.state, reportEvaluator);
}

export async function endInterview(
  state: SessionState,
  reportEvaluator: ReportEvaluator,
): Promise<FinalizeSessionResult> {
  const ended = sessionReducer(state, {
    type: "END_SESSION",
    reason: "candidate_ended",
  });
  if (ended.status !== "GENERATING_REPORT") {
    return {
      ok: false,
      state,
      error: "The interview can only be ended while waiting for an answer.",
    };
  }
  return finalizeSession(ended, reportEvaluator);
}
