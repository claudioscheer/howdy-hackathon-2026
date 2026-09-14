"use client";

import { useRef, useState } from "react";
import { sessionReducer } from "@/lib/interview/reducer";
import type { SessionState } from "@/lib/interview/session";
import { PRACTICE_PAGE } from "@/lib/ui/copy";
import {
  endPracticeAction,
  submitPracticeAnswerAction,
  type PracticeActionResult,
} from "./actions";
import { useElapsedSeconds } from "./practice-elapsed";

type PracticeSessionControls = {
  session: SessionState;
  answer: string;
  error: string | undefined;
  isSubmitting: boolean;
  confirmEnd: boolean;
  elapsedSeconds: number;
  setAnswer: (answer: string) => void;
  setConfirmEnd: (confirm: boolean) => void;
  startInterview: () => void;
  submitCurrentAnswer: () => Promise<void>;
  confirmEndInterview: () => Promise<void>;
};

export function usePracticeSession(
  initialState: SessionState,
): PracticeSessionControls {
  const [session, setSession] = useState(initialState);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  // State updates are not visible to handlers fired in the same tick, so a
  // ref is the single-flight lock: a second submit or an End while a turn is
  // in flight would otherwise send the same pre-answer snapshot again.
  const inFlight = useRef(false);
  const elapsedSeconds = useElapsedSeconds(
    session.status !== "PLANNED" && session.status !== "COMPLETE",
  );

  function startInterview(): void {
    setSession(sessionReducer(session, { type: "START_SESSION" }));
  }

  async function runExclusive(
    request: () => Promise<PracticeActionResult>,
  ): Promise<boolean> {
    inFlight.current = true;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const result = await request();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setSession(result.state);
      return true;
    } catch {
      setError(PRACTICE_PAGE.evaluateFailed);
      return false;
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function submitCurrentAnswer(): Promise<void> {
    if (inFlight.current) {
      return;
    }
    const candidateAnswer = answer.trim();
    if (!candidateAnswer) {
      setError(PRACTICE_PAGE.emptyAnswer);
      return;
    }
    const accepted = await runExclusive(() =>
      submitPracticeAnswerAction(session, candidateAnswer, elapsedSeconds),
    );
    if (accepted) {
      setAnswer("");
    }
  }

  async function confirmEndInterview(): Promise<void> {
    setConfirmEnd(false);
    if (inFlight.current) {
      return;
    }
    await runExclusive(() => endPracticeAction(session, elapsedSeconds));
  }

  return {
    session,
    answer,
    error,
    isSubmitting,
    confirmEnd,
    elapsedSeconds,
    setAnswer,
    setConfirmEnd,
    startInterview,
    submitCurrentAnswer,
    confirmEndInterview,
  };
}
