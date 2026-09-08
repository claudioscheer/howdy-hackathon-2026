import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  saveQuestionsAction: vi.fn(),
}));

import { ReviewQuestionsForm } from "./review-form";

describe("ReviewQuestionsForm", () => {
  it("renders initial prompts and can add another", () => {
    render(
      <ReviewQuestionsForm
        opportunityId="opp-2"
        initialPrompts={["Why this role?"]}
      />,
    );
    expect(screen.getByTestId("question-prompt-0")).toHaveValue(
      "Why this role?",
    );
    fireEvent.click(screen.getByTestId("add-question-button"));
    expect(screen.getByTestId("question-prompt-1")).toBeInTheDocument();
  });

  it("starts with one empty prompt when none exist", () => {
    render(<ReviewQuestionsForm opportunityId="opp-2" initialPrompts={[]} />);
    expect(screen.getByTestId("question-prompt-0")).toHaveValue("");
  });
});
