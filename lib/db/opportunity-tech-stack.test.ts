import { describe, expect, it } from "vitest";
import { OpportunityProfileSchema } from "@/lib/interview/contracts";
import {
  FALLBACK_TECH_STACK,
  profileTechStack,
} from "./opportunity-tech-stack";

describe("profileTechStack", () => {
  it("falls back to a general stack when none was saved", () => {
    expect(profileTechStack([])).toEqual(["General"]);
    expect(FALLBACK_TECH_STACK).toEqual(["General"]);
    expect(
      OpportunityProfileSchema.safeParse({
        id: "opp-1",
        role: "fullstack",
        seniority: "senior",
        targetTechStack: profileTechStack([]),
        interviewType: "behavioral",
      }).success,
    ).toBe(true);
  });

  it("keeps a saved stack unchanged", () => {
    expect(profileTechStack(["TypeScript", "Postgres"])).toEqual([
      "TypeScript",
      "Postgres",
    ]);
  });

  it("returns a fresh array so callers cannot mutate the fallback", () => {
    const stack = profileTechStack([]);
    stack.push("Mutated");
    expect(profileTechStack([])).toEqual(["General"]);
  });
});
