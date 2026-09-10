import {
  InterviewerBriefSchema,
  QuestionImportanceSchema,
  type InterviewerBrief,
} from "./brief";

export type BriefFormFields = {
  competency: string;
  importance: string;
  roleRelevance: string;
  expectedDepth: string;
  evidenceToListenFor: string;
  followUpTriggers: string;
  timeBudgetMinutes: string;
  answerBudget: string;
  maxFollowUps: string;
  stopWhen: string;
};

function listField(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function numberField(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

export function briefFieldsAreEmpty(fields: BriefFormFields): boolean {
  return (
    fields.roleRelevance.trim().length === 0 &&
    fields.expectedDepth.trim().length === 0 &&
    fields.evidenceToListenFor.trim().length === 0 &&
    fields.followUpTriggers.trim().length === 0 &&
    fields.timeBudgetMinutes.trim().length === 0 &&
    fields.answerBudget.trim().length === 0 &&
    fields.maxFollowUps.trim().length === 0 &&
    fields.stopWhen.trim().length === 0
  );
}

export function briefFromFormFields(
  fields: BriefFormFields,
): InterviewerBrief | undefined {
  const importance = QuestionImportanceSchema.safeParse(fields.importance);
  const maxFollowUpsValue = numberField(fields.maxFollowUps);
  const parsed = InterviewerBriefSchema.safeParse({
    competency: fields.competency.trim(),
    roleRelevance: fields.roleRelevance.trim(),
    importance: importance.success ? importance.data : undefined,
    expectedDepth: fields.expectedDepth.trim(),
    evidenceToListenFor: listField(fields.evidenceToListenFor),
    followUpTriggers: listField(fields.followUpTriggers),
    timeBudgetMinutes: numberField(fields.timeBudgetMinutes),
    answerBudget: numberField(fields.answerBudget),
    maxFollowUps: maxFollowUpsValue,
    stopWhen: listField(fields.stopWhen),
  });
  return parsed.success ? parsed.data : undefined;
}

export function linesFromList(values: string[] | undefined): string {
  return (values ?? []).join("\n");
}
