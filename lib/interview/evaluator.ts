import type {
  AnswerEvaluationInput,
  AnswerEvaluator,
  InterviewerDecision,
} from "./contracts";

const OWNED_ACTION_RE =
  /\b(?:i|we)\s+(?:built|changed|created|debugged|deployed|designed|implemented|introduced|investigated|led|measured|migrated|refactored|removed|resolved|tested|traced|used)\b/i;
const MEASURABLE_RE =
  /\b(?:\d+(?:\.\d+)?%?|p\d{2}|milliseconds?|ms|seconds?|minutes?|hours?|days?|weeks?)\b/i;
const TECHNICAL_DETAIL_RE =
  /\b(?:api|cache|database|deployment|index|javascript|kafka|latency|logging|metric|node(?:\.js)?|postgres(?:ql)?|query|react|schema|service|test|typescript)\b/i;
const OUTCOME_RE =
  /\b(?:cut|decreased|delivered|improved|increased|prevented|reduced|resolved|saved|shipped)\b/i;

const FOLLOW_UP_DECISION: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason:
    "The answer needs a concrete example, the candidate's actions, and an observable outcome.",
  dimension: "specificity",
  followUp:
    "Can you make that more specific? Describe the situation, what you personally did, and the result.",
};

const MOVE_ON_DECISION: InterviewerDecision = {
  decision: "MOVE_ON",
  reason: "The answer includes enough concrete evidence to continue.",
};

function evidenceCount(answer: string): number {
  return [
    OWNED_ACTION_RE,
    MEASURABLE_RE,
    TECHNICAL_DETAIL_RE,
    OUTCOME_RE,
  ].filter((pattern) => pattern.test(answer)).length;
}

function wordCount(answer: string): number {
  return answer.trim().split(/\s+/).filter(Boolean).length;
}

export class ScriptedAnswerEvaluator implements AnswerEvaluator {
  async evaluate(input: AnswerEvaluationInput): Promise<unknown> {
    const hasConcreteAnswer =
      evidenceCount(input.answer) >= 2 && wordCount(input.answer) >= 6;
    return hasConcreteAnswer ? MOVE_ON_DECISION : FOLLOW_UP_DECISION;
  }
}
