import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal();
  if (typeof actual !== "object" || actual === null) {
    return { useFormStatus: () => ({ pending: true }) };
  }
  return {
    ...actual,
    useFormStatus: () => ({
      pending: true,
      data: null,
      method: null,
      action: null,
    }),
  };
});

vi.mock("./actions", () => ({
  generateQuestionsAction: vi.fn(),
  saveQuestionsAction: vi.fn(),
}));

import { GenerateQuestionsPanel } from "./generate-panel";
import { ReviewQuestionsForm } from "./review-form";

describe("pending question form labels", () => {
  it("shows preparing while generate is pending", () => {
    render(<GenerateQuestionsPanel opportunityId="opp-2" />);
    expect(screen.getByTestId("generate-questions-submit")).toHaveTextContent(
      "Preparing the questions",
    );
  });

  it("shows saving while review save is pending", () => {
    render(
      <ReviewQuestionsForm opportunityId="opp-2" initialPrompts={["Q"]} />,
    );
    expect(screen.getByTestId("save-questions-submit")).toHaveTextContent(
      "Saving",
    );
  });
});
