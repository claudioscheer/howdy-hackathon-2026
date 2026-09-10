import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BriefFields } from "./brief-fields";
import { emptyReviewQuestion } from "./review-model";

describe("BriefFields", () => {
  it("renders the interviewer brief controls", () => {
    render(
      <BriefFields
        index={0}
        question={{
          ...emptyReviewQuestion(),
          roleRelevance: "Seniors own delivery.",
        }}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId("question-role-relevance-0")).toHaveValue(
      "Seniors own delivery.",
    );
    expect(screen.getByTestId("question-brief-0")).toBeInTheDocument();
    const onChange = vi.fn();
    render(
      <BriefFields
        index={1}
        question={emptyReviewQuestion()}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByTestId("question-expected-depth-1"), {
      target: { value: "A recent owned example." },
    });
    fireEvent.change(screen.getByTestId("question-time-budget-1"), {
      target: { value: "8" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedDepth: "A recent owned example.",
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ timeBudgetMinutes: "8" }),
    );
  });
});
