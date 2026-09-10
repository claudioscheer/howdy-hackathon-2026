import type { TranscriptTurn } from "./contracts";
import type { InterviewerDecision, JudgmentEvidence } from "./judgment";
import { judgmentEvidenceIsGrounded } from "./judgment";

export function candidateTurns(history: TranscriptTurn[]): TranscriptTurn[] {
  return history.filter((turn) => turn.speaker === "candidate");
}

export function candidateTranscript(history: TranscriptTurn[]): string {
  return candidateTurns(history)
    .map((turn) => turn.content)
    .join("\n");
}

export function quoteFromCandidateTurn(
  quote: string,
  history: TranscriptTurn[],
): boolean {
  return candidateTurns(history).some((turn) => turn.content.includes(quote));
}

export function distinctCandidateTurnCount(
  evidence: JudgmentEvidence[],
  history: TranscriptTurn[],
): number {
  const indexes = new Set<number>();
  const turns = candidateTurns(history);
  for (const item of evidence) {
    const index = turns.findIndex((turn) => turn.content.includes(item.quote));
    if (index >= 0) {
      indexes.add(index);
    }
  }
  return indexes.size;
}

export function decisionEvidenceIsValid(
  decision: InterviewerDecision,
  history: TranscriptTurn[],
): boolean {
  if (
    !judgmentEvidenceIsGrounded(decision.evidence, candidateTranscript(history))
  ) {
    return false;
  }
  if (
    !decision.evidence.every((item) =>
      quoteFromCandidateTurn(item.quote, history),
    )
  ) {
    return false;
  }
  if (
    decision.decision === "FOLLOW_UP" &&
    decision.probePurpose === "contradiction"
  ) {
    return distinctCandidateTurnCount(decision.evidence, history) >= 2;
  }
  return true;
}
