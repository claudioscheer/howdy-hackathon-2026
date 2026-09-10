import type { Prisma } from "@prisma/client";
import {
  parseInterviewerBrief,
  QuestionImportanceSchema,
  type InterviewerBrief,
  type QuestionImportance,
} from "@/lib/interview/brief";
import {
  briefFieldsAreEmpty,
  briefFromFormFields,
  type BriefFormFields,
} from "@/lib/interview/draft-brief";
import {
  RubricDimensionSchema,
  type InterviewQuestion,
  type RubricDimension,
} from "@/lib/interview/contracts";

export type QuestionDraft = {
  prompt: string;
  primaryDimension: RubricDimension;
  importance?: QuestionImportance;
  competency?: string;
  brief?: InterviewerBrief;
  briefIncomplete?: boolean;
};

export function storedBrief(value: unknown): InterviewerBrief | undefined {
  return parseInterviewerBrief(value);
}

export function draftFromInterviewQuestion(
  question: InterviewQuestion,
): QuestionDraft {
  return {
    prompt: question.prompt.trim(),
    primaryDimension: question.primaryDimension,
    importance: question.brief?.importance,
    competency: question.brief?.competency,
    brief: question.brief,
  };
}

function formValue(formData: FormData, name: string, index: number): string {
  return String(formData.getAll(name)[index] ?? "");
}

function briefFieldsFromForm(
  index: number,
  formData: FormData,
): BriefFormFields {
  return {
    competency: formValue(formData, "competency", index).trim(),
    importance: formValue(formData, "importance", index),
    roleRelevance: formValue(formData, "roleRelevance", index),
    expectedDepth: formValue(formData, "expectedDepth", index),
    evidenceToListenFor: formValue(formData, "evidenceToListenFor", index),
    followUpTriggers: formValue(formData, "followUpTriggers", index),
    timeBudgetMinutes: formValue(formData, "timeBudgetMinutes", index),
    answerBudget: formValue(formData, "answerBudget", index),
    maxFollowUps: formValue(formData, "maxFollowUps", index),
    stopWhen: formValue(formData, "stopWhen", index),
  };
}

export function draftsFromFormData(formData: FormData): QuestionDraft[] {
  const prompts = formData.getAll("prompt").map((value) => String(value));
  return prompts.flatMap((rawPrompt, index) => {
    const prompt = rawPrompt.trim();
    if (prompt.length === 0) {
      return [];
    }
    return [draftFromFields(prompt, index, formData)];
  });
}

function draftFromFields(
  prompt: string,
  index: number,
  formData: FormData,
): QuestionDraft {
  const fields = briefFieldsFromForm(index, formData);
  const brief = briefFromFormFields(fields);
  const dimension = RubricDimensionSchema.safeParse(
    formData.getAll("primaryDimension")[index],
  );
  const importance = QuestionImportanceSchema.safeParse(fields.importance);
  const competency = fields.competency;
  return {
    prompt,
    primaryDimension: dimension.success ? dimension.data : "specificity",
    importance: importance.success ? importance.data : undefined,
    competency: competency.length > 0 ? competency : undefined,
    brief,
    briefIncomplete: brief === undefined && !briefFieldsAreEmpty(fields),
  };
}

export function prismaQuestionData(
  opportunityId: string,
  draft: QuestionDraft,
  sortOrder: number,
): Prisma.PlannedQuestionCreateManyInput {
  return {
    id: `question-${crypto.randomUUID()}`,
    opportunityId,
    prompt: draft.prompt.trim(),
    sortOrder,
    primaryDimension: draft.primaryDimension,
    importance: draft.importance ?? null,
    competency: draft.competency ?? null,
    brief: draft.brief === undefined ? undefined : { ...draft.brief },
  };
}

export function interviewQuestionFromDraft(
  draft: QuestionDraft,
  index: number,
): InterviewQuestion {
  return {
    id: `draft-${String(index)}`,
    prompt: draft.prompt,
    primaryDimension: draft.primaryDimension,
    brief: draft.brief,
  };
}
