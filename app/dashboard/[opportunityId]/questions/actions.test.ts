import { beforeEach, describe, expect, it, vi } from "vitest";

const startQuestionGeneration = vi.hoisted(() => vi.fn());
const savePlannedQuestions = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/question-generation", () => ({
  startQuestionGeneration,
}));

vi.mock("@/lib/db/questions", () => ({
  savePlannedQuestions,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import { generateQuestionsAction, saveQuestionsAction } from "./actions";

describe("question actions", () => {
  beforeEach(() => {
    startQuestionGeneration.mockReset();
    savePlannedQuestions.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
  });

  it("generates planned questions and returns to review", async () => {
    startQuestionGeneration.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.append("opportunityId", "opp-2");
    await generateQuestionsAction({}, formData);
    expect(startQuestionGeneration).toHaveBeenCalledWith("opp-2");
    expect(redirect).toHaveBeenCalledWith("/dashboard/opp-2/questions");
  });

  it("returns a visible error instead of crashing the page", async () => {
    startQuestionGeneration.mockRejectedValue(
      new Error("OpenCode returned an empty completion."),
    );
    const formData = new FormData();
    formData.append("opportunityId", "opp-2");
    await expect(generateQuestionsAction({}, formData)).resolves.toEqual({
      error: "OpenCode returned an empty completion.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps unknown generation failures to a generic message", async () => {
    startQuestionGeneration.mockRejectedValue("nope");
    const formData = new FormData();
    formData.append("opportunityId", "opp-2");
    await expect(generateQuestionsAction({}, formData)).resolves.toEqual({
      error: "Question generation failed.",
    });
  });

  it("rejects a generate submit without an opportunity id", async () => {
    await expect(generateQuestionsAction({}, new FormData())).resolves.toEqual({
      error: "Opportunity not found.",
    });
  });

  it("saves submitted prompts", async () => {
    savePlannedQuestions.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.append("prompt", "First?");
    formData.append("importance", "core");
    formData.append("competency", "Ownership");
    formData.append("primaryDimension", "specificity");
    formData.append("prompt", "Second?");
    formData.append("importance", "supporting");
    formData.append("competency", "Judgment");
    formData.append("primaryDimension", "structure");
    formData.append("targetMinutes", "40");
    formData.append("sessionAnswerBudget", "10");
    formData.append("opportunityId", "opp-2");
    await saveQuestionsAction({}, formData);
    expect(savePlannedQuestions).toHaveBeenCalledWith(
      "opp-2",
      [
        {
          prompt: "First?",
          primaryDimension: "specificity",
          importance: "core",
          competency: "Ownership",
          brief: undefined,
          briefIncomplete: false,
        },
        {
          prompt: "Second?",
          primaryDimension: "structure",
          importance: "supporting",
          competency: "Judgment",
          brief: undefined,
          briefIncomplete: false,
        },
      ],
      { targetMinutes: 40, sessionAnswerBudget: 10 },
    );
  });

  it("returns a visible save error instead of redirecting", async () => {
    savePlannedQuestions.mockRejectedValue(
      new Error("The plan repeats a question prompt."),
    );
    const formData = new FormData();
    formData.append("opportunityId", "opp-2");
    await expect(saveQuestionsAction({}, formData)).resolves.toEqual({
      error: "The plan repeats a question prompt.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects a save submit without an opportunity id", async () => {
    await expect(saveQuestionsAction({}, new FormData())).resolves.toEqual({
      error: "Opportunity not found.",
    });
  });

  it("maps unknown save failures to a generic message", async () => {
    savePlannedQuestions.mockRejectedValue("nope");
    const formData = new FormData();
    formData.append("opportunityId", "opp-2");
    await expect(saveQuestionsAction({}, formData)).resolves.toEqual({
      error: "Could not save questions.",
    });
  });
});
