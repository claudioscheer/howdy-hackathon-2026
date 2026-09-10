"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { QUESTIONS_PAGE } from "@/lib/ui/copy";
import { saveQuestionsAction } from "./actions";
import { QuestionFields } from "./question-fields";
import {
  applyQuestionEdit,
  emptyReviewQuestion,
  type ReviewQuestionFields,
} from "./review-model";

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
  initialQuestions,
  targetMinutes,
  sessionAnswerBudget,
}: {
  opportunityId: string;
  initialQuestions: ReviewQuestionFields[];
  targetMinutes: number;
  sessionAnswerBudget: number;
}): React.JSX.Element {
  const [questions, setQuestions] = useState(
    initialQuestions.length > 0 ? initialQuestions : [emptyReviewQuestion()],
  );
  const [state, action] = useActionState(saveQuestionsAction, {});

  return (
    <form
      data-testid="review-questions-form"
      action={action}
      className="flex max-w-3xl flex-col gap-4"
    >
      <input
        type="hidden"
        name="opportunityId"
        value={opportunityId}
        data-testid="save-opportunity-id"
      />
      <p
        data-testid="question-plan-count"
        className="text-sm font-bold uppercase tracking-[0.96px] text-black"
      >
        {String(questions.length)} {QUESTIONS_PAGE.questionCountLabel}
      </p>
      <p className="text-sm leading-relaxed text-[#5a5a5f]">
        {QUESTIONS_PAGE.reviewDescription}
      </p>
      <input type="hidden" name="targetMinutes" value={String(targetMinutes)} />
      <input
        type="hidden"
        name="sessionAnswerBudget"
        value={String(sessionAnswerBudget)}
      />
      {state.error !== undefined ? (
        <p
          role="alert"
          data-testid="save-questions-error"
          className="text-sm font-bold text-[#a30000]"
        >
          {state.error}
        </p>
      ) : null}
      {questions.map((question, index) => (
        <QuestionFields
          key={`question-${String(index)}`}
          index={index}
          total={questions.length}
          question={question}
          onChange={(next) => {
            setQuestions((current) =>
              current.map((item, itemIndex) =>
                itemIndex === index ? applyQuestionEdit(item, next) : item,
              ),
            );
          }}
        />
      ))}
      <button
        type="button"
        data-testid="add-question-button"
        onClick={() => {
          setQuestions((current) => [...current, emptyReviewQuestion()]);
        }}
        className="inline-flex w-fit items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
      >
        {QUESTIONS_PAGE.addQuestion}
      </button>
      <SaveSubmit />
    </form>
  );
}
