import {
  ReportDimensionSchema,
  type InterviewQuestion,
  type QuestionOutcome,
  type ReportDimension,
  type TranscriptTurn,
} from "./contracts";
import { REPORT_DIMENSIONS, scoreDimension } from "./report-score";
import { EARLY_END_REPORT_SUMMARY } from "./report-signal";

type ReportInput = {
  questions: InterviewQuestion[];
  transcript: TranscriptTurn[];
  questionOutcomes: QuestionOutcome[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textField(
  value: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const field = value[key];
  if (typeof field !== "string" || field.trim().length === 0) {
    return undefined;
  }
  return field;
}

function insufficientFrom(
  policy: Extract<ReportDimension, { status: "insufficient_evidence" }>,
  model: unknown,
): ReportDimension {
  const record = isRecord(model) ? model : undefined;
  return {
    status: "insufficient_evidence",
    summary: textField(record, "summary") ?? policy.summary,
    evidence: [],
    remainingUnknown:
      textField(record, "remainingUnknown") ?? policy.remainingUnknown,
  };
}

function scoredFrom(
  policy: Extract<ReportDimension, { status: "scored" }>,
  model: unknown,
): ReportDimension {
  const parsed = ReportDimensionSchema.safeParse(model);
  if (parsed.success && parsed.data.status === "scored") {
    return parsed.data;
  }
  return policy;
}

function endedEarly(outcomes: QuestionOutcome[]): boolean {
  return outcomes.some(
    (outcome) => outcome.appliedStopReason === "candidate_ended_early",
  );
}

export function applyReportScorePolicy(
  raw: unknown,
  input: ReportInput,
): unknown {
  if (!isRecord(raw) || !isRecord(raw.dimensions)) {
    return raw;
  }
  const dimensions: Record<string, ReportDimension> = {};
  for (const key of REPORT_DIMENSIONS) {
    const policy = scoreDimension(
      key,
      input.questions,
      input.transcript,
      input.questionOutcomes,
    );
    const model = raw.dimensions[key];
    dimensions[key] =
      policy.status === "insufficient_evidence"
        ? insufficientFrom(policy, model)
        : scoredFrom(policy, model);
  }
  const allInsufficient = REPORT_DIMENSIONS.every(
    (key) => dimensions[key]?.status === "insufficient_evidence",
  );
  if (endedEarly(input.questionOutcomes) && allInsufficient) {
    return { ...raw, dimensions, summary: EARLY_END_REPORT_SUMMARY };
  }
  return { ...raw, dimensions };
}
