import type {
  EvaluationClock,
  EvaluationPush,
  InterviewQuestion,
} from "./contracts";
import { questionFollowUpCap, topicAnswerBudget } from "./session-policy";
import type { SessionState } from "./session";

export type AnswerClockInput = {
  elapsedSeconds?: number;
  submittedAt?: string;
};

export function evaluationClock(input: AnswerClockInput = {}): EvaluationClock {
  return {
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    elapsedSeconds: Math.max(0, input.elapsedSeconds ?? 0),
  };
}

export function evaluationPush(
  state: SessionState,
  question: InterviewQuestion,
): EvaluationPush {
  const followUpCap = questionFollowUpCap(question);
  const topicBudget = topicAnswerBudget(question);
  const remainingSessionAnswers = Math.max(
    0,
    state.sessionAnswerBudget - state.sessionAnswersUsed,
  );
  return {
    followUpsUsed: state.followUpCount,
    followUpCap,
    remainingFollowUps: Math.max(0, followUpCap - state.followUpCount),
    answersOnThisQuestion: state.questionAnswersUsed,
    topicAnswerBudget: topicBudget,
    sessionAnswersUsed: state.sessionAnswersUsed,
    sessionAnswerBudget: state.sessionAnswerBudget,
    remainingSessionAnswers,
    importance: question.brief?.importance,
    timeBudgetMinutes: question.brief?.timeBudgetMinutes,
  };
}
