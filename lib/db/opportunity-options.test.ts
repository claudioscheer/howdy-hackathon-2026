import { describe, expect, it } from "vitest";
import {
  formatRoleLabel,
  formatSeniorityLabel,
  opportunityHeading,
  OpportunityRoleSchema,
  OpportunitySenioritySchema,
} from "./opportunity-options";

describe("opportunity role and seniority options", () => {
  it("accepts the manager dropdown values", () => {
    expect(OpportunityRoleSchema.parse("fullstack")).toBe("fullstack");
    expect(OpportunitySenioritySchema.parse("medium")).toBe("medium");
    expect(OpportunitySenioritySchema.parse("staff")).toBe("staff");
  });

  it("rejects unknown role and seniority values", () => {
    expect(OpportunityRoleSchema.safeParse("").success).toBe(false);
    expect(OpportunitySenioritySchema.safeParse("lead").success).toBe(false);
  });

  it("formats known values and leaves unknown labels unchanged", () => {
    expect(formatRoleLabel("fullstack")).toBe("Full stack");
    expect(formatRoleLabel("Product Engineer")).toBe("Product Engineer");
    expect(formatSeniorityLabel("junior")).toBe("Junior");
    expect(formatSeniorityLabel("Principal")).toBe("Principal");
    expect(opportunityHeading("fullstack", "senior")).toBe("Senior Full stack");
  });
});
