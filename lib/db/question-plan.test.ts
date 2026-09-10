import { describe, expect, it } from "vitest";
import {
  draftsToPlan,
  planSettingsFromForm,
  saveDraftProblems,
} from "./question-plan";

describe("saved question plans", () => {
  it("reads plan settings from the form with fallbacks", () => {
    const formData = new FormData();
    formData.append("targetMinutes", "38");
    formData.append("sessionAnswerBudget", "9");
    expect(planSettingsFromForm(formData)).toEqual({
      targetMinutes: 38,
      sessionAnswerBudget: 9,
    });
    expect(planSettingsFromForm(new FormData())).toEqual({
      targetMinutes: 40,
      sessionAnswerBudget: 10,
    });
    const invalid = new FormData();
    invalid.append("targetMinutes", "nope");
    invalid.append("sessionAnswerBudget", "0");
    expect(planSettingsFromForm(invalid)).toEqual({
      targetMinutes: 40,
      sessionAnswerBudget: 10,
    });
  });

  it("rejects a partial brief and duplicate prompts", () => {
    expect(
      saveDraftProblems(
        [
          {
            prompt: "First?",
            primaryDimension: "specificity",
            briefIncomplete: true,
          },
        ],
        { targetMinutes: 40, sessionAnswerBudget: 10 },
        "behavioral",
      ),
    ).toEqual([
      "Complete every interviewer brief or clear the partial brief fields.",
    ]);
    expect(
      saveDraftProblems(
        [
          { prompt: "Same?", primaryDimension: "specificity" },
          { prompt: "Same?", primaryDimension: "specificity" },
        ],
        { targetMinutes: 40, sessionAnswerBudget: 10 },
        "behavioral",
      ),
    ).toContain("The plan repeats a question prompt.");
  });

  it("builds a plan from drafts", () => {
    expect(
      draftsToPlan([{ prompt: "Only?", primaryDimension: "specificity" }], {
        targetMinutes: 38,
        sessionAnswerBudget: 9,
      }).questions[0]?.prompt,
    ).toBe("Only?");
  });
});
