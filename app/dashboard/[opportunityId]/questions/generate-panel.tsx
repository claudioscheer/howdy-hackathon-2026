"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { QUESTION_POLL_INTERVAL_MS } from "@/lib/db/question-prep-wait";
import { QUESTIONS_PAGE } from "@/lib/ui/copy";
import { generateQuestionsAction } from "./actions";

function GenerateSubmit(): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid="generate-questions-submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[14px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? QUESTIONS_PAGE.generating : QUESTIONS_PAGE.generateButton}
    </button>
  );
}

export function GenerateQuestionsPanel({
  opportunityId,
  initialError,
}: {
  opportunityId: string;
  initialError?: string;
}): React.JSX.Element {
  const [state, action] = useActionState(generateQuestionsAction, {
    error: initialError,
  });
  return (
    <form
      data-testid="generate-questions-form"
      action={action}
      className="flex max-w-xl flex-col gap-4"
    >
      <input
        type="hidden"
        name="opportunityId"
        value={opportunityId}
        data-testid="generate-opportunity-id"
      />
      <p
        data-testid="generate-questions-copy"
        className="text-sm leading-relaxed text-[#5a5a5f]"
      >
        {QUESTIONS_PAGE.generateDescription}
      </p>
      {state.error !== undefined ? (
        <p
          role="alert"
          data-testid="generate-questions-error"
          className="text-sm font-bold text-[#a30000]"
        >
          {state.error}
        </p>
      ) : null}
      <GenerateSubmit />
    </form>
  );
}

export function GeneratingQuestionsStatus({
  intervalMs = QUESTION_POLL_INTERVAL_MS,
}: {
  intervalMs?: number;
} = {}): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [router, intervalMs]);

  return (
    <div
      data-testid="generating-questions-status"
      className="flex flex-col gap-2"
    >
      <p className="text-sm font-bold uppercase tracking-[0.96px] text-black">
        {QUESTIONS_PAGE.generating}
      </p>
      <p className="text-sm text-[#5a5a5f]">{QUESTIONS_PAGE.generatingHint}</p>
    </div>
  );
}
