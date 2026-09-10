"use client";

import { useState } from "react";
import { sessionReducer } from "@/lib/interview/reducer";
import type { SessionState } from "@/lib/interview/session";
import { PRACTICE_PAGE } from "@/lib/ui/copy";
import { endPracticeAction, submitPracticeAnswerAction } from "./actions";
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
  const elapsedSeconds = useElapsedSeconds(
    session.status !== "PLANNED" && session.status !== "COMPLETE",
  );

  function startInterview(): void {
    setSession(sessionReducer(session, { type: "START_SESSION" }));
  }

  async function submitCurrentAnswer(): Promise<void> {
    const candidateAnswer = answer.trim();
    if (!candidateAnswer) {
      setError(PRACTICE_PAGE.emptyAnswer);
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      const result = await submitPracticeAnswerAction(
        session,
        candidateAnswer,
        elapsedSeconds,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSession(result.state);
      setAnswer("");
    } catch {
      setError(PRACTICE_PAGE.evaluateFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmEndInterview(): Promise<void> {
    setConfirmEnd(false);
    setIsSubmitting(true);
    setError(undefined);
    try {
      const result = await endPracticeAction(session, elapsedSeconds);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSession(result.state);
    } catch {
      setError(PRACTICE_PAGE.evaluateFailed);
    } finally {
      setIsSubmitting(false);
    }
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
