import { type EvaluationInput, type InterviewerDecision } from "./schema";
import { overlapRatio } from "./tokens";

const GENERIC_CLAIM_RE =
  /\b(always communicate well|good communicator|work hard and deliver|easy to work with|team player|never drop the ball|keep \w+ (happy|aligned))\b/;
const SOFT_SKILL_RE =
  /\b(communicat\w*|collaborat\w*|stakeholders?|aligned|passionate)\b/;
const YEAR_RE = /\b(19\d{2}|200\d|201\d|2020|2021)\b/;
const FIRST_JOB_RE = /\b(first job|first company|years ago)\b/;
const LEGACY_STACK_RE = /\b(jquery|php\s*5|classic\s*asp|ftp|apache)\b/;
const PROCESS_RE =
  /\b(standup|standups|scrum|agile|jira|sprint|rituals?|velocity|retro|ceremony|ceremonies)\b/;
const TECHNICAL_RE =
  /\b(database|schema|index|indexes|query|kafka|partition|postgres|billing|cache|latency|tenant|replica|distributed)\b/;
const SENIOR_RE =
  /\b(principal|staff engineer|senior full-stack|senior engineer|architect)\b/;
const WEAK_SQL_RE =
  /select\s*\*|don't use indexes|do not use indexes|indexes? take up too much/;

const SPECIFICITY_DECISION: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason:
    "The answer makes high-level claims without citing a concrete example, metric, or situation.",
  dimension: "specificity",
  followUp:
    "Can you describe a specific time when that communication changed an outcome? Walk me through what happened.",
};

const RELEVANCE_DECISION: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason:
    "The candidate relied heavily on an older, less relevant experience instead of current hands-on experience.",
  dimension: "relevance",
  followUp:
    "That was several years ago—how have you applied those concepts recently in your current stack?",
};

const STRUCTURE_DECISION: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason:
    "The response wanders to general agile practices rather than answering the technical question that was asked.",
  dimension: "structure",
  followUp:
    "Let's bring it back to the technical question: how would you approach this specific design?",
};

const FUNDAMENTALS_DECISION: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason:
    "Senior claims coupled with a breakdown on fundamental querying and indexing concepts.",
  dimension: "fundamentals",
  followUp:
    "What is the query performance implication of an unindexed subquery at scale, and how would you optimize it?",
};

export const CONCRETE_MOVE_ON: InterviewerDecision = {
  decision: "MOVE_ON",
  reason: "The candidate answered concretely with relevant technical depth.",
};

export function hasConcreteEvidence(answer: string): boolean {
  return /\d/.test(answer);
}

export function isVagueSpecificity(answer: string): boolean {
  const text = answer.toLowerCase();
  if (GENERIC_CLAIM_RE.test(text)) {
    return true;
  }
  if (hasConcreteEvidence(text)) {
    return false;
  }
  return SOFT_SKILL_RE.test(text);
}

export function isRecencyMismatch(answer: string): boolean {
  const text = answer.toLowerCase();
  return (
    YEAR_RE.test(text) || FIRST_JOB_RE.test(text) || LEGACY_STACK_RE.test(text)
  );
}

export function isOffTopic(question: string, answer: string): boolean {
  const q = question.toLowerCase();
  const a = answer.toLowerCase();
  if (!TECHNICAL_RE.test(q)) {
    return false;
  }
  if (overlapRatio(q, a) >= 0.15) {
    return false;
  }
  return PROCESS_RE.test(a);
}

export function isFundamentalsGap(answer: string): boolean {
  const text = answer.toLowerCase();
  return SENIOR_RE.test(text) && WEAK_SQL_RE.test(text);
}

export function matchHeuristic(
  input: EvaluationInput,
): InterviewerDecision | null {
  const answer = input.answer.toLowerCase();
  if (isVagueSpecificity(answer)) {
    return SPECIFICITY_DECISION;
  }
  if (isRecencyMismatch(answer)) {
    return RELEVANCE_DECISION;
  }
  if (isOffTopic(input.question, answer)) {
    return STRUCTURE_DECISION;
  }
  if (isFundamentalsGap(answer)) {
    return FUNDAMENTALS_DECISION;
  }
  return null;
}

export function decideStub(input: EvaluationInput): InterviewerDecision {
  return matchHeuristic(input) ?? CONCRETE_MOVE_ON;
}
