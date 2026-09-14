import { PRACTICE_PAGE } from "@/lib/ui/copy";

export function PracticeComposer({
  answer,
  error,
  isSubmitting,
  onAnswerChange,
  onSubmit,
}: {
  answer: string;
  error?: string;
  isSubmitting: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => Promise<void>;
}): React.JSX.Element {
  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (!isSubmitting) {
      void onSubmit();
    }
  }

  return (
    <form
      className="border-t border-[#e0e0e8] pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          void onSubmit();
        }
      }}
    >
      <label htmlFor="candidate-answer" className="text-sm font-bold">
        {PRACTICE_PAGE.composerLabel}
      </label>
      <textarea
        id="candidate-answer"
        data-testid="candidate-answer"
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        disabled={isSubmitting}
        placeholder={PRACTICE_PAGE.composerPlaceholder}
        className="mt-2 w-full resize-y rounded border border-[#a8a8ad] bg-white p-4 text-sm leading-6 outline-none focus:border-black disabled:opacity-60"
      />
      <p className="mt-2 text-xs leading-5 text-[#5a5a5f]">
        {PRACTICE_PAGE.dictationHint}
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-bold text-[#a30000]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        data-testid="submit-answer"
        disabled={isSubmitting}
        className="mt-4 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? PRACTICE_PAGE.evaluating : PRACTICE_PAGE.submitAnswer}
      </button>
    </form>
  );
}
