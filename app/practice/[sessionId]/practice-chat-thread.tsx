import { opportunityHeading } from "@/lib/db/opportunity-options";
import type { TranscriptTurn } from "@/lib/interview/contracts";
import type { SessionState } from "@/lib/interview/session";
import { practiceGreeting } from "@/lib/ui/copy";

function bubbleClass(speaker: TranscriptTurn["speaker"]): string {
  if (speaker === "interviewer") {
    return "border-black bg-black text-white";
  }
  return "border-[#e0e0e8] bg-white text-black";
}

function turnContent(
  turn: TranscriptTurn,
  index: number,
  roleLabel: string,
): string {
  const isOpening =
    index === 0 && turn.speaker === "interviewer" && turn.kind === "question";
  if (isOpening) {
    return `${practiceGreeting(roleLabel)}\n\n${turn.content}`;
  }
  return turn.content;
}

export function PracticeChatThread({
  session,
}: {
  session: SessionState;
}): React.JSX.Element {
  const roleLabel = opportunityHeading(
    session.opportunity.role,
    session.opportunity.seniority,
  );
  const lastInterviewer = [...session.history]
    .reverse()
    .find((turn) => turn.speaker === "interviewer");

  return (
    <ol
      aria-label="Interview transcript"
      className="flex flex-col gap-3"
      data-testid="interview-transcript"
    >
      {session.history.map((turn, index) => (
        <li
          key={turn.id}
          className={`rounded border p-4 ${bubbleClass(turn.speaker)}`}
          data-testid={
            turn.id === lastInterviewer?.id ? "current-question" : undefined
          }
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
            {turn.speaker}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {turnContent(turn, index, roleLabel)}
          </p>
        </li>
      ))}
    </ol>
  );
}
