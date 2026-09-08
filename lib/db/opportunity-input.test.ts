import { describe, expect, it } from "vitest";
import {
  fieldErrorsFromZod,
  INITIAL_CREATE_OPPORTUNITY_STATE,
  isCreateOpportunityField,
  parseCreateOpportunityForm,
  parseTechStack,
} from "./opportunity-input";
import { z } from "zod";

describe("opportunity form input", () => {
  it("starts the create form with empty errors", () => {
    expect(INITIAL_CREATE_OPPORTUNITY_STATE).toEqual({ errors: {} });
  });

  it("splits and trims a comma-separated tech stack", () => {
    expect(parseTechStack(" React, Node.js , ,PostgreSQL ")).toEqual([
      "React",
      "Node.js",
      "PostgreSQL",
    ]);
    expect(parseTechStack("   ")).toEqual([]);
  });

  it("accepts a complete form payload", () => {
    const formData = new FormData();
    formData.set("candidateDisplayName", " Alex Rivera ");
    formData.set("role", "fullstack");
    formData.set("seniority", "senior");
    formData.set("targetTechStack", "React, Node.js");
    formData.set("interviewType", "behavioral");
    formData.set("jobDescription", " Ship React and Node.js product work. ");
    formData.set("curriculum", " Alex Rivera. Fullstack engineer. ");

    const parsed = parseCreateOpportunityForm(formData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.candidateDisplayName).toBe("Alex Rivera");
      expect(parsed.data.targetTechStack).toEqual(["React", "Node.js"]);
      expect(parsed.data.jobDescription).toBe(
        "Ship React and Node.js product work.",
      );
      expect(parsed.data.curriculum).toBe("Alex Rivera. Fullstack engineer.");
    }
  });

  it("accepts a payload with no tech stack", () => {
    const formData = new FormData();
    formData.set("candidateDisplayName", "Alex Rivera");
    formData.set("role", "fullstack");
    formData.set("seniority", "senior");
    formData.set("interviewType", "behavioral");
    formData.set("jobDescription", "Ship product features in React.");
    formData.set("curriculum", "Alex Rivera. Fullstack engineer.");

    const parsed = parseCreateOpportunityForm(formData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.targetTechStack).toEqual([]);
    }
  });

  it("rejects missing name, role, and briefing text", () => {
    const parsed = parseCreateOpportunityForm(new FormData());
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }
    const errors = fieldErrorsFromZod(parsed.error);
    expect(errors.candidateDisplayName).toBe("Enter the candidate name.");
    expect(errors.role).toBe("Select a role.");
    expect(errors.seniority).toBe("Select a seniority level.");
    expect(errors.targetTechStack).toBeUndefined();
    expect(errors.interviewType).toBeDefined();
    expect(errors.jobDescription).toBe("Paste the job description.");
    expect(errors.curriculum).toBe("Paste the candidate curriculum.");
  });

  it("ignores non-field zod paths when mapping errors", () => {
    const schema = z.object({ other: z.string().min(1) });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(fieldErrorsFromZod(result.error)).toEqual({});
    expect(isCreateOpportunityField("role")).toBe(true);
    expect(isCreateOpportunityField("form")).toBe(false);
  });

  it("keeps the first message when a field has two issues", () => {
    const schema = z.object({
      role: z.string().min(1, "Enter a role.").min(8, "Too short."),
    });
    const result = schema.safeParse({ role: "" });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(fieldErrorsFromZod(result.error).role).toBe("Enter a role.");
  });
});
