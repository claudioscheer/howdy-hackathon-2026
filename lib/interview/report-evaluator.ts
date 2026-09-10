import {
  ReportEvaluationInputSchema,
  type ReportEvaluator,
  type SessionReport,
} from "./contracts";
import { scoreDimension } from "./report-score";

export function buildScriptedReport(
  input: ReturnType<typeof ReportEvaluationInputSchema.parse>,
): SessionReport {
  const dimensions = {
    relevance: scoreDimension(
      "relevance",
      input.questions,
      input.transcript,
      input.questionOutcomes,
    ),
    specificity: scoreDimension(
      "specificity",
      input.questions,
      input.transcript,
      input.questionOutcomes,
    ),
    fundamentals: scoreDimension(
      "fundamentals",
      input.questions,
      input.transcript,
      input.questionOutcomes,
    ),
    structure: scoreDimension(
      "structure",
      input.questions,
      input.transcript,
      input.questionOutcomes,
    ),
  };
  const endedEarly = input.questionOutcomes.some(
    (outcome) => outcome.appliedStopReason === "candidate_ended_early",
  );
  return {
    attemptNumber: input.attemptNumber,
    summary: endedEarly
      ? "The interview ended before every core topic was assessed. Remaining competencies are insufficient evidence, not a low score."
      : "The scorecard is grounded in the answers given in this practice interview. Use clearer situation-action-result language on the next attempt.",
    dimensions,
  };
}

export class ScriptedReportEvaluator implements ReportEvaluator {
  async evaluate(input: unknown): Promise<unknown> {
    const parsed = ReportEvaluationInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("The report evaluator received an invalid session.");
    }
    return buildScriptedReport(parsed.data);
  }
}
