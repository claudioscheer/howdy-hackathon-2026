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
      { error: "OpenCode returned an empty completion." },
      vi.fn(),
    ],
  };
});

vi.mock("./actions", () => ({
  generateQuestionsAction: vi.fn(),
}));

import { GenerateQuestionsPanel } from "./generate-panel";

describe("generate questions error", () => {
  it("shows a planner failure on the page instead of crashing", () => {
    render(<GenerateQuestionsPanel opportunityId="opp-3" />);
    expect(screen.getByTestId("generate-questions-error")).toHaveTextContent(
      "OpenCode returned an empty completion.",
    );
  });
});
