import type {
  AnswerEvaluationInput,
  AnswerEvaluator,
  InterviewerDecision,
  JudgmentEvidence,
} from "./contracts";
import { answersQuestion } from "./relevance";

const OWNED_ACTION_RE =
  /\b(?:i|we)\s+(?:built|changed|created|debugged|deployed|designed|implemented|introduced|investigated|led|measured|migrated|refactored|removed|resolved|tested|traced|used)\b/i;
const MEASURABLE_RE =
  /\b(?:\d+(?:\.\d+)?%?|p\d{2}|milliseconds?|ms|seconds?|minutes?|hours?|days?|weeks?)\b/i;
const TECHNICAL_DETAIL_RE =
  /\b(?:api|cache|database|deployment|index|javascript|kafka|latency|logging|metric|node(?:\.js)?|postgres(?:ql)?|query|react|schema|service|test|typescript)\b/i;
const OUTCOME_RE =
  /\b(?:cut|decreased|delivered|improved|increased|prevented|reduced|resolved|saved|shipped)\b/i;

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

function quoteFrom(answer: string): string {
  const trimmed = answer.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return answer.length > 0 ? answer : " ";
}

function cited(answer: string, supports: string): JudgmentEvidence[] {
  return [{ quote: quoteFrom(answer), supports }];
}

function followUp(
  input: AnswerEvaluationInput,
  fields: Omit<
    Extract<InterviewerDecision, { decision: "FOLLOW_UP" }>,
    "decision" | "evidence"
  >,
): InterviewerDecision {
  return {
    decision: "FOLLOW_UP",
    ...fields,
    evidence: cited(input.answer, fields.unresolvedGap),
  };
}

export class ScriptedAnswerEvaluator implements AnswerEvaluator {
  async evaluate(input: AnswerEvaluationInput): Promise<unknown> {
    if (
      !answersQuestion(input.question.prompt, input.answer, {
        brief: input.question.brief,
        history: input.history,
      })
    ) {
      return followUp(input, {
        reason: "The answer does not address the question that was asked.",
        dimension: "relevance",
        probePurpose: "relevance",
        unresolvedGap: "The candidate has not answered the asked question.",
        followUp:
          "That does not answer the question I asked. How does it relate to the situation in the question?",
      });
    }
    const hasConcreteAnswer =
      evidenceCount(input.answer) >= 2 && wordCount(input.answer) >= 6;
    if (!hasConcreteAnswer) {
      return followUp(input, {
        reason:
          "The answer needs a concrete example, the candidate's actions, and an observable outcome.",
        dimension: "specificity",
        probePurpose: "clarification",
        unresolvedGap:
          "The answer lacks a concrete example, personal action, and result.",
        followUp:
          "Can you make that more specific? Describe the situation, what you personally did, and the result.",
      });
    }
    return {
      decision: "MOVE_ON",
      reason: "The answer includes enough concrete evidence to continue.",
      recommendedStopReason: "evidence_sufficient",
      evidence: cited(
        input.answer,
        "The answer includes an owned action and an observable result.",
      ),
    };
  }
}
