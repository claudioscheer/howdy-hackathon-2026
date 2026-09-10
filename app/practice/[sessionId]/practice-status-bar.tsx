import { questionFollowUpCap } from "@/lib/interview/session-policy";
import type { SessionState } from "@/lib/interview/session";
import { PRACTICE_PAGE, formatElapsed, practiceProgress } from "@/lib/ui/copy";

export function PracticeStatusBar({
  session,
  isComplete,
  elapsedSeconds,
  targetMinutes,
  onEnd,
}: {
  session: SessionState;
  isComplete: boolean;
  elapsedSeconds: number;
  targetMinutes: number;
  onEnd: () => void;
}): React.JSX.Element {
  const question = session.questions[session.questionIndex];
  return (
    <header className="border-b border-[#e0e0e8] pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
        {session.opportunity.role} · Attempt {session.attemptNumber} of 2
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          {PRACTICE_PAGE.badge}
        </h1>
        <p
          aria-live="polite"
          className="text-sm font-bold"
          data-testid="question-progress"
        >
          {practiceProgress(
            session.questionIndex,
            session.questions.length,
            isComplete,
          )}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5a5a5f]">
        <p data-testid="practice-timer">
          {formatElapsed(elapsedSeconds)} / {targetMinutes}:00
        </p>
        {!isComplete && question !== undefined ? (
          <p data-testid="follow-up-count">
            Follow-ups on this question: {session.followUpCount} of{" "}
            {questionFollowUpCap(question)}
          </p>
        ) : null}
        {!isComplete ? (
          <button
            type="button"
            data-testid="end-interview-button"
            onClick={onEnd}
            className="cursor-pointer text-xs font-bold uppercase tracking-wider text-black underline"
          >
            {PRACTICE_PAGE.endInterview}
          </button>
        ) : null}
      </div>
    </header>
  );
}
