import { z } from "zod";
import { InterviewTypeSchema } from "@/lib/interview/contracts";
import {
  OpportunityRoleSchema,
  OpportunitySenioritySchema,
} from "./opportunity-options";

export const CREATE_OPPORTUNITY_FIELDS = [
  "candidateDisplayName",
  "role",
  "seniority",
  "targetTechStack",
  "interviewType",
  "jobDescription",
  "curriculum",
] as const;

export type CreateOpportunityField = (typeof CREATE_OPPORTUNITY_FIELDS)[number];

export const CreateOpportunityInputSchema = z.object({
  candidateDisplayName: z.string().trim().min(1, "Enter the candidate name."),
  role: OpportunityRoleSchema,
  seniority: OpportunitySenioritySchema,
  targetTechStack: z.array(z.string().min(1)),
  interviewType: InterviewTypeSchema,
  jobDescription: z.string().trim().min(1, "Paste the job description."),
  curriculum: z.string().trim().min(1, "Paste the candidate curriculum."),
});

export type CreateOpportunityInput = z.infer<
  typeof CreateOpportunityInputSchema
>;

export type FieldErrorMap = Partial<
  Record<CreateOpportunityField | "form", string>
>;

export interface CreateOpportunityState {
  errors: FieldErrorMap;
}

export const INITIAL_CREATE_OPPORTUNITY_STATE: CreateOpportunityState = {
  errors: {},
};

export function isCreateOpportunityField(
  value: string,
): value is CreateOpportunityField {
  return CREATE_OPPORTUNITY_FIELDS.some((field) => field === value);
}

export function parseTechStack(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function fieldErrorsFromZod(error: z.ZodError): FieldErrorMap {
  const errors: FieldErrorMap = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || !isCreateOpportunityField(key)) {
      continue;
    }
    if (errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function parseCreateOpportunityForm(
  formData: FormData,
): z.ZodSafeParseResult<CreateOpportunityInput> {
  return CreateOpportunityInputSchema.safeParse({
    candidateDisplayName: String(formData.get("candidateDisplayName") ?? ""),
    role: String(formData.get("role") ?? ""),
    seniority: String(formData.get("seniority") ?? ""),
    targetTechStack: parseTechStack(
      String(formData.get("targetTechStack") ?? ""),
    ),
    interviewType: String(formData.get("interviewType") ?? ""),
    jobDescription: String(formData.get("jobDescription") ?? ""),
    curriculum: String(formData.get("curriculum") ?? ""),
  });
}
