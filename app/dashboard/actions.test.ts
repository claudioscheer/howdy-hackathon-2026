import { beforeEach, describe, expect, it, vi } from "vitest";

const createOpportunityWithCandidate = vi.hoisted(() => vi.fn());
const updateOpportunityWithCandidate = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/opportunities", () => ({
  createOpportunityWithCandidate,
}));

vi.mock("@/lib/db/opportunity-write", () => ({
  updateOpportunityWithCandidate,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import { INITIAL_CREATE_OPPORTUNITY_STATE } from "@/lib/db/opportunity-input";
import { createOpportunityAction, updateOpportunityAction } from "./actions";

function validForm(): FormData {
  const formData = new FormData();
  formData.set("candidateDisplayName", "Alex Rivera");
  formData.set("role", "fullstack");
  formData.set("seniority", "senior");
  formData.set("targetTechStack", "React, Node.js");
  formData.set("interviewType", "behavioral");
  formData.set(
    "jobDescription",
    "Ship product features across React, Node.js, and PostgreSQL.",
  );
  formData.set(
    "curriculum",
    "Alex Rivera. Fullstack engineer. Shipped TypeScript contract tests.",
  );
  return formData;
}

describe("createOpportunityAction", () => {
  beforeEach(() => {
    createOpportunityWithCandidate.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
  });

  it("returns field errors for an incomplete form", async () => {
    const result = await createOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      new FormData(),
    );
    expect(result.errors.role).toBe("Select a role.");
    expect(createOpportunityWithCandidate).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("saves a valid opportunity and redirects to the dashboard", async () => {
    createOpportunityWithCandidate.mockResolvedValue({ id: "opp-new" });
    await createOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      validForm(),
    );
    expect(createOpportunityWithCandidate).toHaveBeenCalledWith({
      candidateDisplayName: "Alex Rivera",
      role: "fullstack",
      seniority: "senior",
      targetTechStack: ["React", "Node.js"],
      interviewType: "behavioral",
      jobDescription:
        "Ship product features across React, Node.js, and PostgreSQL.",
      curriculum:
        "Alex Rivera. Fullstack engineer. Shipped TypeScript contract tests.",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a form error when persistence fails", async () => {
    createOpportunityWithCandidate.mockRejectedValue(new Error("db down"));
    const result = await createOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      validForm(),
    );
    expect(result.errors.form).toBe(
      "Could not save this opportunity. Try again.",
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("updateOpportunityAction", () => {
  beforeEach(() => {
    updateOpportunityWithCandidate.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
  });

  it("rejects a missing opportunity id", async () => {
    const result = await updateOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      validForm(),
    );
    expect(result.errors.form).toBe(
      "Could not save this opportunity. Try again.",
    );
    expect(updateOpportunityWithCandidate).not.toHaveBeenCalled();
  });

  it("saves edits and redirects", async () => {
    const formData = validForm();
    formData.set("opportunityId", "opp-2");
    updateOpportunityWithCandidate.mockResolvedValue(undefined);
    await updateOpportunityAction(INITIAL_CREATE_OPPORTUNITY_STATE, formData);
    expect(updateOpportunityWithCandidate).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns field errors for incomplete edits", async () => {
    const formData = new FormData();
    formData.set("opportunityId", "opp-2");
    const result = await updateOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      formData,
    );
    expect(result.errors.role).toBe("Select a role.");
  });

  it("returns a form error when the update fails", async () => {
    const formData = validForm();
    formData.set("opportunityId", "opp-2");
    updateOpportunityWithCandidate.mockRejectedValue(new Error("db down"));
    const result = await updateOpportunityAction(
      INITIAL_CREATE_OPPORTUNITY_STATE,
      formData,
    );
    expect(result.errors.form).toBe(
      "Could not save this opportunity. Try again.",
    );
  });
});
