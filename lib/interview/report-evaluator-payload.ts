import { ReportEvaluationInputSchema, type TranscriptTurn } from "./contracts";

function transcriptTurns(history: TranscriptTurn[]): Array<{
  speaker: string;
  kind: string;
  questionId: string;
  content: string;
}> {
  return history.map((turn) => ({
    speaker: turn.speaker,
    kind: turn.kind,
    questionId: turn.questionId,
    content: turn.content,
  }));
}

export function reportEvaluatorUserPayload(input: unknown): string {
  const parsed = ReportEvaluationInputSchema.safeParse(input);
  if (!parsed.success) {
    return JSON.stringify(input);
  }
  return JSON.stringify({
    role: parsed.data.opportunity.role,
    seniority: parsed.data.opportunity.seniority,
    interviewType: parsed.data.opportunity.interviewType,
    targetTechStack: parsed.data.opportunity.targetTechStack,
    attemptNumber: parsed.data.attemptNumber,
    questions: parsed.data.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      primaryDimension: question.primaryDimension,
    })),
    questionOutcomes: parsed.data.questionOutcomes,
    transcript: transcriptTurns(parsed.data.transcript),
  });
}
