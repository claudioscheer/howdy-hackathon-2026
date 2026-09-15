"use server";

import { savePracticeAttempt } from "@/lib/db/practice-attempts";
import {
  createPracticeAnswerEvaluator,
  createPracticeQuestionSpeaker,
  createPracticeReportEvaluator,
} from "@/lib/interview/practice-evaluators";
import {
  endInterview,
  progressInterview,
  type FinalizeSessionResult,
} from "@/lib/interview/session-report";
import { SessionStateSchema } from "@/lib/interview/session";
import type { SubmitAnswerResult } from "@/lib/interview/turn";

export type PracticeActionResult =
  SubmitAnswerResult | FinalizeSessionResult | { ok: false; error: string };

function failedRead(): { ok: false; error: string } {
  return { ok: false, error: "The session could not be read." };
}

async function persistIfComplete(
  result: SubmitAnswerResult | FinalizeSessionResult,
  elapsedSeconds: number,
): Promise<void> {
  if (!result.ok || result.state.status !== "COMPLETE") {
    return;
  }
  try {
    await savePracticeAttempt(result.state, elapsedSeconds);
  } catch {
    return;
  }
}

export async function submitPracticeAnswerAction(
  rawState: unknown,
  answer: string,
  elapsedSeconds = 0,
  mock = false,
): Promise<PracticeActionResult> {
  const parsed = SessionStateSchema.safeParse(rawState);
  if (!parsed.success) {
    return failedRead();
  }
  const result = await progressInterview(
    parsed.data,
    answer,
    createPracticeAnswerEvaluator(process.env, mock),
    createPracticeReportEvaluator(process.env),
    createPracticeQuestionSpeaker(process.env, mock),
    { elapsedSeconds },
  );
  await persistIfComplete(result, elapsedSeconds);
  return result;
}

export async function endPracticeAction(
  rawState: unknown,
  elapsedSeconds = 0,
): Promise<PracticeActionResult> {
  const parsed = SessionStateSchema.safeParse(rawState);
  if (!parsed.success) {
    return failedRead();
  }
  const result = await endInterview(
    parsed.data,
    createPracticeReportEvaluator(process.env),
  );
  await persistIfComplete(result, elapsedSeconds);
  return result;
}
