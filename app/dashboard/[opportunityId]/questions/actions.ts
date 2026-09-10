"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { draftsFromFormData } from "@/lib/db/question-drafts";
import { planSettingsFromForm } from "@/lib/db/question-plan";
import {
  generatePlannedQuestions,
  savePlannedQuestions,
} from "@/lib/db/questions";

export type GenerateQuestionsState = {
  error?: string;
};

function opportunityIdFrom(formData: FormData): string {
  return String(formData.get("opportunityId") ?? "").trim();
}

export async function generateQuestionsAction(
  _previous: GenerateQuestionsState,
  formData: FormData,
): Promise<GenerateQuestionsState> {
  const opportunityId = opportunityIdFrom(formData);
  if (opportunityId.length === 0) {
    return { error: "Opportunity not found." };
  }
  try {
    await generatePlannedQuestions(opportunityId);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Question generation failed.",
    };
  }
  revalidatePath(`/dashboard/${opportunityId}/questions`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/${opportunityId}/questions`);
}

export type SaveQuestionsState = {
  error?: string;
};

export async function saveQuestionsAction(
  _previous: SaveQuestionsState,
  formData: FormData,
): Promise<SaveQuestionsState> {
  const opportunityId = opportunityIdFrom(formData);
  if (opportunityId.length === 0) {
    return { error: "Opportunity not found." };
  }
  try {
    await savePlannedQuestions(
      opportunityId,
      draftsFromFormData(formData),
      planSettingsFromForm(formData),
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save questions.",
    };
  }
  revalidatePath(`/dashboard/${opportunityId}/questions`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/${opportunityId}/questions`);
}
