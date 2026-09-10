import { describe, expect, it } from "vitest";
import { competencyChanged, isMaterialBriefEdit } from "./stale-brief";

describe("stale interviewer briefs", () => {
  it("treats prompt and competency edits as material", () => {
    const previous = { prompt: "Conflict?", competency: "Conflict" };
    expect(
      isMaterialBriefEdit(previous, {
        prompt: "Caching?",
        competency: "Conflict",
      }),
    ).toBe(true);
    expect(
      isMaterialBriefEdit(previous, {
        prompt: "Conflict?",
        competency: "Caching",
      }),
    ).toBe(true);
    expect(
      isMaterialBriefEdit(previous, {
        prompt: "Conflict?",
        competency: "Conflict",
      }),
    ).toBe(false);
    expect(
      competencyChanged(previous, {
        prompt: "Conflict?",
        competency: "Caching",
      }),
    ).toBe(true);
  });
});
