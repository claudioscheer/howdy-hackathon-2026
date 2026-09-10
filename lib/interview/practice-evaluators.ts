import type { AnswerEvaluator, ReportEvaluator } from "./contracts";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { createOpenCodeAnswerEvaluator } from "./evaluator-opencode";
import { createOpenCodeQuestionSpeaker } from "./interviewer-ask-opencode";
import {
  PlannedQuestionSpeaker,
  type QuestionSpeaker,
} from "./interviewer-ask";
import { ScriptedReportEvaluator } from "./report-evaluator";

export function openCodeKeyPresent(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env.OPENCODE_API_KEY ?? "").trim().length > 0;
}

export function livePracticeEvaluatorEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.PRACTICE_LIVE_EVALUATOR === "0") {
    return false;
  }
  return openCodeKeyPresent(env);
}

export function createPracticeAnswerEvaluator(
  env: NodeJS.ProcessEnv = process.env,
): AnswerEvaluator {
  if (!livePracticeEvaluatorEnabled(env)) {
    return new ScriptedAnswerEvaluator();
  }
  return createOpenCodeAnswerEvaluator();
}

export function createPracticeQuestionSpeaker(
  env: NodeJS.ProcessEnv = process.env,
): QuestionSpeaker {
  if (!livePracticeEvaluatorEnabled(env)) {
    return new PlannedQuestionSpeaker();
  }
  return createOpenCodeQuestionSpeaker();
}

export function createPracticeReportEvaluator(): ReportEvaluator {
  return new ScriptedReportEvaluator();
}
