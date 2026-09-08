"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { QUESTIONS_PAGE } from "@/lib/ui/copy";
import { saveQuestionsAction } from "./actions";

function SaveSubmit(): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid="save-questions-submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[14px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? QUESTIONS_PAGE.savingQuestions : QUESTIONS_PAGE.saveQuestions}
    </button>
  );
}

export function ReviewQuestionsForm({
  opportunityId,
  initialPrompts,
}: {
  opportunityId: string;
  initialPrompts: string[];
}): React.JSX.Element {
  const [prompts, setPrompts] = useState(
    initialPrompts.length > 0 ? initialPrompts : [""],
  );

  return (
    <form
      data-testid="review-questions-form"
      action={saveQuestionsAction.bind(null, opportunityId)}
      className="flex max-w-xl flex-col gap-4"
    >
      <p className="text-sm leading-relaxed text-[#5a5a5f]">
        {QUESTIONS_PAGE.reviewDescription}
      </p>
      {prompts.map((prompt, index) => (
        <textarea
          key={`prompt-${String(index)}`}
          name="prompt"
          data-testid={`question-prompt-${String(index)}`}
          defaultValue={prompt}
          rows={4}
          className="rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base text-black transition-colors focus:border-black focus:outline-none"
        />
      ))}
      <button
        type="button"
        data-testid="add-question-button"
        onClick={() => {
          setPrompts((current) => [...current, ""]);
        }}
        className="inline-flex w-fit items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
      >
        {QUESTIONS_PAGE.addQuestion}
      </button>
      <SaveSubmit />
    </form>
  );
}
