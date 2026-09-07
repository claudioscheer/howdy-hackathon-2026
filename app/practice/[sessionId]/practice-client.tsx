"use client";

import { useState } from "react";
import { ScriptedAnswerEvaluator } from "@/lib/interview/evaluator";
import { sessionReducer } from "@/lib/interview/reducer";
import { createSeededSession } from "@/lib/interview/seed";
import type { SessionState } from "@/lib/interview/session";
import { submitAnswer } from "@/lib/interview/turn";
import {
  AnswerForm,
  CurrentQuestion,
  PracticeHeader,
  Transcript,
} from "./practice-view";

const evaluator = new ScriptedAnswerEvaluator();

function createStartedSession(sessionId: string): SessionState {
  return sessionReducer(createSeededSession(sessionId), {
    type: "START_SESSION",
  });
}

export function PracticeClient({
  sessionId,
}: {
  sessionId: string;
}): React.JSX.Element {
  const [session, setSession] = useState(() => createStartedSession(sessionId));
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const question = session.questions[session.questionIndex];
  const isComplete = session.status === "COMPLETE" || question === undefined;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const candidateAnswer = answer.trim();

    if (!candidateAnswer) {
      setError("Enter an answer before continuing.");
      return;
    }

    setError(undefined);
    setIsSubmitting(true);

    try {
      const result = await submitAnswer(session, candidateAnswer, evaluator);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSession(result.state);
      setAnswer("");
    } catch {
      setError("Your answer could not be evaluated. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-8 text-black sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded border border-[#e0e0e8] bg-white p-6 sm:p-8">
          <PracticeHeader session={session} isComplete={isComplete} />
          <CurrentQuestion session={session} />

          {!isComplete && (
            <AnswerForm
              answer={answer}
              error={error}
              isSubmitting={isSubmitting}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmit}
            />
          )}
        </section>

        <aside className="rounded border border-[#e0e0e8] bg-white p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Transcript
          </h2>
          <Transcript session={session} />
        </aside>
      </div>
    </main>
  );
}
