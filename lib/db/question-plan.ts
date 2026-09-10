import {
  DEFAULT_SESSION_ANSWER_BUDGET,
  DEFAULT_TARGET_MINUTES,
  type OpportunityProfile,
  type QuestionPlan,
} from "@/lib/interview/contracts";
import { savedPlanProblems } from "@/lib/interview/plan-quality";
import {
  interviewQuestionFromDraft,
  type QuestionDraft,
} from "./question-drafts";

export type PlanSettings = {
  targetMinutes: number;
  sessionAnswerBudget: number;
};

export function planSettingsFromForm(formData: FormData): PlanSettings {
  return {
    targetMinutes: positiveInt(
      formData.get("targetMinutes"),
      DEFAULT_TARGET_MINUTES,
    ),
    sessionAnswerBudget: positiveInt(
      formData.get("sessionAnswerBudget"),
      DEFAULT_SESSION_ANSWER_BUDGET,
    ),
  };
}

function positiveInt(
  value: FormDataEntryValue | null,
  fallback: number,
): number {
  if (typeof value !== "string") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function draftsToPlan(
  drafts: QuestionDraft[],
  settings: PlanSettings,
): QuestionPlan {
  return {
    targetMinutes: settings.targetMinutes,
    sessionAnswerBudget: settings.sessionAnswerBudget,
    questions: drafts.map((draft, index) =>
      interviewQuestionFromDraft(draft, index),
    ),
  };
}

export function saveDraftProblems(
  drafts: QuestionDraft[],
  settings: PlanSettings,
  interviewType: OpportunityProfile["interviewType"],
): string[] {
  if (drafts.some((draft) => draft.briefIncomplete === true)) {
    return [
      "Complete every interviewer brief or clear the partial brief fields.",
    ];
  }
  return savedPlanProblems(draftsToPlan(drafts, settings), interviewType);
}
