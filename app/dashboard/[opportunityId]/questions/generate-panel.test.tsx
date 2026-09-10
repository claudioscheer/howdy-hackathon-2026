import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
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
    expect(screen.getByTestId("generate-opportunity-id")).toHaveValue("opp-2");
    expect(screen.getByTestId("generate-questions-submit")).toHaveTextContent(
      "Generate questions",
    );
    expect(screen.getByTestId("generate-questions-copy")).toHaveTextContent(
      "close to 40 minutes",
    );
  });

  it("renders with an initial error message", () => {
    render(
      <GenerateQuestionsPanel
        opportunityId="opp-2"
        initialError="Generation timed out."
      />,
    );
    expect(screen.getByTestId("generate-questions-error")).toHaveTextContent(
      "Generation timed out.",
    );
  });

  it("renders the preparing status and polls on interval", () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      refresh,
      forward: vi.fn(),
    });
    const { unmount } = render(<GeneratingQuestionsStatus intervalMs={1000} />);
    expect(screen.getByTestId("generating-questions-status")).toHaveTextContent(
      "Preparing the questions",
    );
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(refresh).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(refresh).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(2000);
    expect(refresh).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
