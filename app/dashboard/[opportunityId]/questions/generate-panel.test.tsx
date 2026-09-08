import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  generateQuestionsAction: vi.fn(),
}));

import {
  GenerateQuestionsPanel,
  GeneratingQuestionsStatus,
} from "./generate-panel";

describe("generate questions panel", () => {
  it("renders the generate CTA", () => {
    render(<GenerateQuestionsPanel opportunityId="opp-2" />);
    expect(screen.getByTestId("generate-questions-form")).toBeInTheDocument();
    expect(screen.getByTestId("generate-questions-submit")).toHaveTextContent(
      "Generate questions",
    );
  });

  it("renders the preparing status", () => {
    render(<GeneratingQuestionsStatus />);
    expect(screen.getByTestId("generating-questions-status")).toHaveTextContent(
      "Preparing the questions",
    );
  });
});
