"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOpportunityWithCandidate } from "@/lib/db/opportunities";
import { updateOpportunityWithCandidate } from "@/lib/db/opportunity-write";
import {
  fieldErrorsFromZod,
  parseCreateOpportunityForm,
  type CreateOpportunityState,
} from "@/lib/db/opportunity-input";

export type { CreateOpportunityState };

export async function createOpportunityAction(
  _prev: CreateOpportunityState,
  formData: FormData,
): Promise<CreateOpportunityState> {
  const parsed = parseCreateOpportunityForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await createOpportunityWithCandidate(parsed.data);
  } catch {
    return {
      errors: { form: "Could not save this opportunity. Try again." },
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateOpportunityAction(
  _prev: CreateOpportunityState,
  formData: FormData,
): Promise<CreateOpportunityState> {
  const id = String(formData.get("opportunityId") ?? "").trim();
  if (id.length === 0) {
    return { errors: { form: "Could not save this opportunity. Try again." } };
  }
  const parsed = parseCreateOpportunityForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await updateOpportunityWithCandidate(id, parsed.data);
  } catch {
    return {
      errors: { form: "Could not save this opportunity. Try again." },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}/edit`);
  redirect("/dashboard");
}
