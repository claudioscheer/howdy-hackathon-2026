import {
  MAX_FOLLOW_UPS_PER_QUESTION,
  MAX_SESSION_ATTEMPTS,
  type SessionState,
} from "@/lib/interview/session";

export function Transcript({
  session,
}: {
  session: SessionState;
}): React.JSX.Element {
  return (
    <ol
      aria-label="Interview transcript"
      className="flex flex-col gap-3"
      data-testid="interview-transcript"
    >
      {session.history.map((turn) => (
        <li
          key={turn.id}
          className={`rounded border p-4 ${
            turn.speaker === "interviewer"
              ? "border-black bg-black text-white"
              : "border-[#e0e0e8] bg-white text-black"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
            {turn.speaker}
          </p>
          <p className="mt-1 text-sm leading-6">{turn.content}</p>
        </li>
      ))}
    </ol>
  );
}

export function PracticeHeader({
  session,
  isComplete,
}: {
  session: SessionState;
  isComplete: boolean;
}): React.JSX.Element {
  return (
    <header className="border-b border-[#e0e0e8] pb-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
        {session.opportunity.role} · Attempt {session.attemptNumber} of{" "}
        {MAX_SESSION_ATTEMPTS}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          Practice interview
        </h1>
        <p
          aria-live="polite"
          className="text-sm font-bold"
          data-testid="question-progress"
        >
          {isComplete
            ? "Interview complete"
            : `Question ${session.questionIndex + 1} of ${session.questions.length}`}
        </p>
      </div>
    </header>
  );
}

export function CurrentQuestion({
  session,
}: {
  session: SessionState;
}): React.JSX.Element {
  const question = session.questions[session.questionIndex];
  const isComplete = session.status === "COMPLETE" || question === undefined;
  const activePrompt = session.history.reduce(
    (prompt, turn) => (turn.speaker === "interviewer" ? turn.content : prompt),
    question?.prompt,
  );

  return (
    <div className="py-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
        Current question
      </p>
      <h2
        className="mt-2 text-xl font-bold leading-8"
        data-testid="current-question"
      >
        {isComplete ? "You completed this practice interview." : activePrompt}
      </h2>
      {!isComplete && (
        <p
          className="mt-3 text-sm text-[#5a5a5f]"
          data-testid="follow-up-count"
        >
          Follow-ups on this question: {session.followUpCount} of{" "}
          {MAX_FOLLOW_UPS_PER_QUESTION}
        </p>
      )}
    </div>
  );
}

export function AnswerForm({
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
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}): React.JSX.Element {
  return (
    <form className="border-t border-[#e0e0e8] pt-6" onSubmit={onSubmit}>
      <label htmlFor="candidate-answer" className="text-sm font-bold">
        Your answer
      </label>
      <textarea
        id="candidate-answer"
        data-testid="candidate-answer"
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        rows={5}
        disabled={isSubmitting}
        placeholder="Describe what you did, why, and the measurable result."
        className="mt-2 w-full resize-y rounded border border-[#a8a8ad] bg-white p-4 text-sm leading-6 outline-none focus:border-black disabled:opacity-60"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-[#a30000]">
          {error}
        </p>
      )}
      <button
        type="submit"
        data-testid="submit-answer"
        disabled={isSubmitting}
        className="mt-4 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? "Evaluating…" : "Submit answer"}
      </button>
    </form>
  );
}
