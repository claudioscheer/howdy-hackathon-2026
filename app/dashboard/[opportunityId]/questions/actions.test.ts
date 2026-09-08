import { beforeEach, describe, expect, it, vi } from "vitest";

const generatePlaceholderQuestions = vi.hoisted(() => vi.fn());
const savePlannedQuestions = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/questions", () => ({
  generatePlaceholderQuestions,
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
    generatePlaceholderQuestions.mockReset();
    savePlannedQuestions.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
  });

  it("generates placeholder questions and returns to review", async () => {
    generatePlaceholderQuestions.mockResolvedValue(undefined);
    await generateQuestionsAction("opp-2");
    expect(generatePlaceholderQuestions).toHaveBeenCalledWith("opp-2");
    expect(redirect).toHaveBeenCalledWith("/dashboard/opp-2/questions");
  });

  it("saves submitted prompts", async () => {
    savePlannedQuestions.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.append("prompt", "First?");
    formData.append("prompt", "Second?");
    await saveQuestionsAction("opp-2", formData);
    expect(savePlannedQuestions).toHaveBeenCalledWith("opp-2", [
      "First?",
      "Second?",
    ]);
  });
});
