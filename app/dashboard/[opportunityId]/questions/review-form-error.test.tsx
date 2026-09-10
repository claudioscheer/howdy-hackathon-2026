import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  if (typeof actual !== "object" || actual === null) {
    return { useActionState: () => [{ error: "failed" }, vi.fn()] };
  }
  return {
    ...actual,
    useActionState: () => [
      { error: "The plan repeats a question prompt." },
      vi.fn(),
    ],
  };
});

vi.mock("./actions", () => ({
  saveQuestionsAction: vi.fn(),
}));

import { emptyReviewQuestion } from "./question-fields";
import { ReviewQuestionsForm } from "./review-form";

describe("review questions save error", () => {
  it("shows a save failure on the form", () => {
    render(
      <ReviewQuestionsForm
        opportunityId="opp-2"
        targetMinutes={40}
        sessionAnswerBudget={10}
        initialQuestions={[emptyReviewQuestion()]}
      />,
    );
    expect(screen.getByTestId("save-questions-error")).toHaveTextContent(
      "The plan repeats a question prompt.",
    );
  });
});
