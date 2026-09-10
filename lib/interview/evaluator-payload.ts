import {
  AnswerEvaluationInputSchema,
  type AnswerEvaluationInput,
  type TranscriptTurn,
} from "./contracts";

function transcriptTurns(history: TranscriptTurn[]): Array<{
  speaker: string;
  kind: string;
  content: string;
}> {
  return history.map((turn) => ({
    speaker: turn.speaker,
    kind: turn.kind,
    content: turn.content,
  }));
}

export function answerEvaluatorUserPayload(input: unknown): string {
  const parsed = AnswerEvaluationInputSchema.safeParse(input);
  if (!parsed.success) {
    return JSON.stringify(input);
  }
  return JSON.stringify(compiledEvaluation(parsed.data));
}

function compiledEvaluation(input: AnswerEvaluationInput): {
  compiledAt: string;
  elapsedSeconds: number;
  role: string;
  seniority: string;
  interviewType: AnswerEvaluationInput["opportunity"]["interviewType"];
  question: string;
  brief: AnswerEvaluationInput["question"]["brief"] | null;
  latestAnswer: string;
  transcript: ReturnType<typeof transcriptTurns>;
  push: AnswerEvaluationInput["push"] | null;
} {
  return {
    compiledAt: input.clock?.submittedAt ?? new Date().toISOString(),
    elapsedSeconds: input.clock?.elapsedSeconds ?? 0,
    role: input.opportunity.role,
    seniority: input.opportunity.seniority,
    interviewType: input.opportunity.interviewType,
    question: input.question.prompt,
    brief: input.question.brief ?? null,
    latestAnswer: input.answer,
    transcript: transcriptTurns(input.history),
    push: input.push ?? null,
  };
}
