import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  emptyReviewQuestion,
  questionLegend,
  QuestionFields,
} from "./question-fields";

describe("QuestionFields", () => {
  it("renders prompt, competency, and importance controls", () => {
    render(
      <QuestionFields
        index={0}
        total={4}
        question={{
          ...emptyReviewQuestion(),
          prompt: "What did you own recently?",
          competency: "Ownership",
          importance: "core",
          expectedDepth: "A recent owned example.",
        }}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId("question-prompt-0")).toHaveValue(
      "What did you own recently?",
    );
    expect(screen.getByTestId("question-competency-0")).toHaveValue(
      "Ownership",
    );
    expect(screen.getByTestId("question-importance-0")).toHaveValue("core");
    expect(screen.getByTestId("question-legend-0")).toHaveTextContent(
      "1 of 4 · Ownership",
    );
    expect(screen.getByTestId("question-expected-depth-0")).toHaveValue(
      "A recent owned example.",
    );
  });

  it("notifies the parent when importance changes", () => {
    const onChange = vi.fn();
    render(
      <QuestionFields
        index={0}
        total={1}
        question={emptyReviewQuestion()}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByTestId("question-competency-0"), {
      target: { value: "Ownership" },
    });
    fireEvent.change(screen.getByTestId("question-prompt-0"), {
      target: { value: "What did you own?" },
    });
    fireEvent.change(screen.getByTestId("question-importance-0"), {
      target: { value: "core" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ importance: "core" }),
    );
    fireEvent.change(screen.getByTestId("question-importance-0"), {
      target: { value: "nope" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ importance: "" }),
    );
  });

  it("falls back to importance or a generic label", () => {
    expect(
      questionLegend(1, 3, { competency: "", importance: "supporting" }),
    ).toBe("2 of 3 · supporting");
    expect(questionLegend(2, 3, { competency: "  ", importance: "" })).toBe(
      "3 of 3 · Question",
    );
  });
});
