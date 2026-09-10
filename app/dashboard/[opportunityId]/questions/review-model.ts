import {
  QuestionImportanceSchema,
  type InterviewerBrief,
  type QuestionImportance,
} from "@/lib/interview/brief";
import { linesFromList } from "@/lib/interview/draft-brief";
import {
  competencyChanged,
  isMaterialBriefEdit,
} from "@/lib/interview/stale-brief";
import { QUESTIONS_PAGE } from "@/lib/ui/copy";

export type ReviewQuestionFields = {
  prompt: string;
  importance: QuestionImportance | "";
  competency: string;
  primaryDimension: string;
  roleRelevance: string;
  expectedDepth: string;
  evidenceToListenFor: string;
  followUpTriggers: string;
  timeBudgetMinutes: string;
  answerBudget: string;
  maxFollowUps: string;
  stopWhen: string;
};

export function emptyReviewQuestion(): ReviewQuestionFields {
  return {
    prompt: "",
    importance: "",
    competency: "",
    primaryDimension: "specificity",
    roleRelevance: "",
    expectedDepth: "",
    evidenceToListenFor: "",
    followUpTriggers: "",
    timeBudgetMinutes: "",
    answerBudget: "",
    maxFollowUps: "",
    stopWhen: "",
  };
}

function filledOrBrief(value: string, fallback: string | undefined): string {
  if (value.length > 0) {
    return value;
  }
  return fallback ?? "";
}

function importanceOrBlank(
  value: QuestionImportance | "",
  fallback: QuestionImportance | undefined,
): QuestionImportance | "" {
  const parsed = QuestionImportanceSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return fallback ?? "";
}

function numberOrBlank(value: number | undefined): string {
  if (value === undefined) {
    return "";
  }
  return String(value);
}

export function fieldsFromBrief(
  prompt: string,
  primaryDimension: string,
  importance: QuestionImportance | "",
  competency: string,
  brief: InterviewerBrief | undefined,
): ReviewQuestionFields {
  return {
    prompt,
    importance: importanceOrBlank(importance, brief?.importance),
    competency: filledOrBrief(competency, brief?.competency),
    primaryDimension,
    roleRelevance: brief?.roleRelevance ?? "",
    expectedDepth: brief?.expectedDepth ?? "",
    evidenceToListenFor: linesFromList(brief?.evidenceToListenFor),
    followUpTriggers: linesFromList(brief?.followUpTriggers),
    timeBudgetMinutes: numberOrBlank(brief?.timeBudgetMinutes),
    answerBudget: numberOrBlank(brief?.answerBudget),
    maxFollowUps: numberOrBlank(brief?.maxFollowUps),
    stopWhen: linesFromList(brief?.stopWhen),
  };
}

export function questionLegend(
  index: number,
  total: number,
  question: Pick<ReviewQuestionFields, "competency" | "importance">,
): string {
  const title =
    question.competency.trim() ||
    question.importance ||
    QUESTIONS_PAGE.questionLabel;
  return `${String(index + 1)} of ${String(total)} · ${title}`;
}

export function applyQuestionEdit(
  previous: ReviewQuestionFields,
  next: ReviewQuestionFields,
): ReviewQuestionFields {
  if (!isMaterialBriefEdit(previous, next)) {
    return next;
  }
  return {
    ...next,
    roleRelevance: competencyChanged(previous, next) ? "" : next.roleRelevance,
    expectedDepth: "",
    evidenceToListenFor: "",
    followUpTriggers: "",
    stopWhen: "",
  };
}
