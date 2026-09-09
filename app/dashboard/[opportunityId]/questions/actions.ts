"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generatePlannedQuestions,
  savePlannedQuestions,
} from "@/lib/db/questions";

export async function generateQuestionsAction(
  opportunityId: string,
): Promise<void> {
  await generatePlannedQuestions(opportunityId);
  revalidatePath(`/dashboard/${opportunityId}/questions`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/${opportunityId}/questions`);
}

export async function saveQuestionsAction(
  opportunityId: string,
  formData: FormData,
): Promise<void> {
  const prompts = formData.getAll("prompt").map((value) => String(value));
  await savePlannedQuestions(opportunityId, prompts);
  revalidatePath(`/dashboard/${opportunityId}/questions`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/${opportunityId}/questions`);
}
