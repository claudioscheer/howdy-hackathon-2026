import { describe, expect, it } from "vitest";
import {
  formatTechStackTrack,
  hasStoredBriefing,
  practicePath,
} from "./opportunity-item";

describe("opportunity item helpers", () => {
  it("joins a tech stack into a dashboard track", () => {
    expect(formatTechStackTrack(["React", "Node.js", "PostgreSQL"])).toBe(
      "React, Node.js, PostgreSQL",
    );
    expect(formatTechStackTrack([])).toBe("");
  });

  it("requires both a job description and a curriculum", () => {
    expect(
      hasStoredBriefing("Senior fullstack role", "Alex Rivera resume"),
    ).toBe(true);
    expect(hasStoredBriefing("  ", "resume")).toBe(false);
    expect(hasStoredBriefing("role", "   ")).toBe(false);
    expect(hasStoredBriefing("role", undefined)).toBe(false);
  });

  it("builds a practice path from the session id or opportunity id", () => {
    expect(
      practicePath({
        id: "opp-2",
        practiceSessionId: "fullstack-product-engineer",
      }),
    ).toBe("/practice/fullstack-product-engineer");
    expect(practicePath({ id: "opp-3" })).toBe("/practice/opp-3");
  });
});
