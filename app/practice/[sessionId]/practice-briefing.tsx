import { opportunityHeading } from "@/lib/db/opportunity-options";
import { PRACTICE_PAGE, practiceFormatBody } from "@/lib/ui/copy";
import type { SessionState } from "@/lib/interview/session";

export function PracticeBriefing({
  session,
  targetMinutes,
  onStart,
}: {
  session: SessionState;
  targetMinutes: number;
  onStart: () => void;
}): React.JSX.Element {
  return (
    <section className="rounded border border-[#e0e0e8] bg-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
        {opportunityHeading(
          session.opportunity.role,
          session.opportunity.seniority,
        )}{" "}
        · Attempt {session.attemptNumber} of 2
      </p>
      <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">
        {PRACTICE_PAGE.briefingTitle}
      </h1>
      <p className="mt-4 text-sm leading-6 text-[#5a5a5f]">
        {practiceFormatBody(targetMinutes)}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#5a5a5f]">
        {PRACTICE_PAGE.dictationHint}
      </p>
      <button
        type="button"
        data-testid="start-interview-button"
        onClick={onStart}
        className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
      >
        {PRACTICE_PAGE.startButton}
      </button>
    </section>
  );
}
