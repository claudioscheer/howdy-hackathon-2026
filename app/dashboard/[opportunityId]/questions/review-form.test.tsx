import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  saveQuestionsAction: vi.fn(),
}));

import { emptyReviewQuestion } from "./question-fields";
import { ReviewQuestionsForm } from "./review-form";

describe("ReviewQuestionsForm", () => {
  it("renders initial questions and can add another", () => {
    render(
      <ReviewQuestionsForm
        opportunityId="opp-2"
        targetMinutes={40}
        sessionAnswerBudget={10}
        initialQuestions={[
          {
            ...emptyReviewQuestion(),
            prompt: "Why this role?",
            importance: "core",
          },
        ]}
      />,
    );
    expect(screen.getByTestId("save-opportunity-id")).toHaveValue("opp-2");
    expect(screen.getByTestId("question-prompt-0")).toHaveValue(
      "Why this role?",
    );
    expect(screen.getByTestId("question-plan-count")).toHaveTextContent(
      "1 scored questions · close to 40 minutes",
    );
    expect(screen.getByTestId("question-importance-0")).toHaveValue("core");
    fireEvent.change(screen.getByTestId("question-prompt-0"), {
      target: { value: "Tell me about caching instead." },
    });
    expect(screen.getByTestId("question-prompt-0")).toHaveValue(
      "Tell me about caching instead.",
    );
    fireEvent.click(screen.getByTestId("add-question-button"));
    expect(screen.getByTestId("question-prompt-1")).toBeInTheDocument();
    expect(screen.getByTestId("question-importance-1")).toHaveValue("");
    fireEvent.change(screen.getByTestId("question-prompt-0"), {
      target: { value: "Keep the first question." },
    });
    expect(screen.getByTestId("question-prompt-1")).toHaveValue("");
  });

  it("starts with one empty prompt when none exist", () => {
    render(
      <ReviewQuestionsForm
        opportunityId="opp-2"
        targetMinutes={40}
        sessionAnswerBudget={10}
        initialQuestions={[]}
      />,
    );
    expect(screen.getByTestId("question-prompt-0")).toHaveValue("");
  });
});
