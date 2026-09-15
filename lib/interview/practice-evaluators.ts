import type { AnswerEvaluator, ReportEvaluator } from "./contracts";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { createOpenCodeAnswerEvaluator } from "./evaluator-opencode";
import { createOpenCodeQuestionSpeaker } from "./interviewer-ask-opencode";
import {
  PlannedQuestionSpeaker,
  type QuestionSpeaker,
} from "./interviewer-ask";
import { ScriptedReportEvaluator } from "./report-evaluator";
import { createOpenCodeReportEvaluator } from "./report-evaluator-opencode";

export function openCodeKeyPresent(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env.OPENCODE_API_KEY ?? "").trim().length > 0;
}

export function livePracticeEvaluatorEnabled(
  env: NodeJS.ProcessEnv = process.env,
  mock = false,
): boolean {
  if (mock || env.PRACTICE_LIVE_EVALUATOR === "0") {
    return false;
  }
  return openCodeKeyPresent(env);
}

export function createPracticeAnswerEvaluator(
  env: NodeJS.ProcessEnv = process.env,
  mock = false,
): AnswerEvaluator {
  if (!livePracticeEvaluatorEnabled(env, mock)) {
    return new ScriptedAnswerEvaluator();
  }
  return createOpenCodeAnswerEvaluator();
}

export function createPracticeQuestionSpeaker(
  env: NodeJS.ProcessEnv = process.env,
  mock = false,
): QuestionSpeaker {
  if (!livePracticeEvaluatorEnabled(env, mock)) {
    return new PlannedQuestionSpeaker();
  }
  return createOpenCodeQuestionSpeaker();
}

export function livePracticeReportEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.PRACTICE_LIVE_EVALUATOR === "0") {
    return false;
  }
  return openCodeKeyPresent(env);
}

export function createPracticeReportEvaluator(
  env: NodeJS.ProcessEnv = process.env,
): ReportEvaluator {
  if (!livePracticeReportEnabled(env)) {
    return new ScriptedReportEvaluator();
  }
  return createOpenCodeReportEvaluator();
}
