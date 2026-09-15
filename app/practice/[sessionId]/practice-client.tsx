"use client";

import type { SessionState } from "@/lib/interview/session";
import { PracticeBriefing } from "./practice-briefing";
import { PracticeChatThread } from "./practice-chat-thread";
import { PracticeComposer } from "./practice-composer";
import { PracticeEndDialog } from "./practice-end-dialog";
import { PracticeReportView } from "./practice-report-view";
import { PracticeStatusBar } from "./practice-status-bar";
import { usePracticeSession } from "./use-practice-session";

export function PracticeClient({
  initialState,
  targetMinutes,
  mock = false,
}: {
  initialState: SessionState;
  targetMinutes: number;
  mock?: boolean;
}): React.JSX.Element {
  const practice = usePracticeSession(initialState, mock);
  const isComplete = practice.session.status === "COMPLETE";
  const isPlanned = practice.session.status === "PLANNED";

  if (isPlanned) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-5 py-8 text-black sm:px-8">
        <div className="mx-auto max-w-3xl">
          <PracticeBriefing
            session={practice.session}
            targetMinutes={targetMinutes}
            onStart={practice.startInterview}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-8 text-black sm:px-8">
      <div className="mx-auto max-w-3xl rounded border border-[#e0e0e8] bg-white p-6 sm:p-8">
        <PracticeStatusBar
          session={practice.session}
          isComplete={isComplete}
          elapsedSeconds={practice.elapsedSeconds}
          targetMinutes={targetMinutes}
          isSubmitting={practice.isSubmitting}
          onEnd={() => practice.setConfirmEnd(true)}
        />
        <div className="py-6">
          <PracticeChatThread session={practice.session} />
        </div>
        {!isComplete ? (
          <PracticeComposer
            answer={practice.answer}
            error={practice.error}
            isSubmitting={practice.isSubmitting}
            onAnswerChange={practice.setAnswer}
            onSubmit={practice.submitCurrentAnswer}
          />
        ) : null}
        {practice.session.report ? (
          <PracticeReportView report={practice.session.report} />
        ) : null}
      </div>
      {practice.confirmEnd ? (
        <PracticeEndDialog
          isSubmitting={practice.isSubmitting}
          onCancel={() => practice.setConfirmEnd(false)}
          onConfirm={() => {
            void practice.confirmEndInterview();
          }}
        />
      ) : null}
    </main>
  );
}
