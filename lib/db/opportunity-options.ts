import { z } from "zod";

export const OPPORTUNITY_ROLES = [
  "fullstack",
  "frontend",
  "backend",
  "infrastructure",
  "mobile",
] as const;

export const OPPORTUNITY_SENIORITIES = [
  "junior",
  "medium",
  "senior",
  "staff",
] as const;

export const OpportunityRoleSchema = z.enum(OPPORTUNITY_ROLES, {
  error: "Select a role.",
});
export const OpportunitySenioritySchema = z.enum(OPPORTUNITY_SENIORITIES, {
  error: "Select a seniority level.",
});

export type OpportunityRole = z.infer<typeof OpportunityRoleSchema>;
export type OpportunitySeniority = z.infer<typeof OpportunitySenioritySchema>;

export const ROLE_LABELS: Record<OpportunityRole, string> = {
  fullstack: "Full stack",
  frontend: "Frontend",
  backend: "Backend",
  infrastructure: "Infrastructure",
  mobile: "Mobile",
};

export const SENIORITY_LABELS: Record<OpportunitySeniority, string> = {
  junior: "Junior",
  medium: "Medium",
  senior: "Senior",
  staff: "Staff",
};

export const ROLE_OPTIONS = OPPORTUNITY_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export const SENIORITY_OPTIONS = OPPORTUNITY_SENIORITIES.map((value) => ({
  value,
  label: SENIORITY_LABELS[value],
}));

export const INTERVIEW_TYPE_OPTIONS = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "system_design", label: "System design" },
] as const;

function isOpportunityRole(value: string): value is OpportunityRole {
  return OPPORTUNITY_ROLES.some((role) => role === value);
}

function isOpportunitySeniority(value: string): value is OpportunitySeniority {
  return OPPORTUNITY_SENIORITIES.some((level) => level === value);
}

export function formatRoleLabel(role: string): string {
  if (isOpportunityRole(role)) {
    return ROLE_LABELS[role];
  }
  return role;
}

export function formatSeniorityLabel(seniority: string): string {
  if (isOpportunitySeniority(seniority)) {
    return SENIORITY_LABELS[seniority];
  }
  return seniority;
}

export function opportunityHeading(role: string, seniority: string): string {
  return `${formatSeniorityLabel(seniority)} ${formatRoleLabel(role)}`;
}
