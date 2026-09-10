import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeComposer } from "./practice-composer";

describe("PracticeComposer", () => {
  it("submits on Enter and inserts a newline with Shift+Enter", () => {
    const onSubmit = vi.fn(async () => undefined);
    const onAnswerChange = vi.fn();
    render(
      <PracticeComposer
        answer="A draft"
        isSubmitting={false}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
      />,
    );
    const box = screen.getByRole("textbox", { name: "Your answer" });
    fireEvent.keyDown(box, { key: "a" });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not submit Enter while evaluating and shows the error", () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <PracticeComposer
        answer="Pending"
        error="Try again."
        isSubmitting
        onAnswerChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Your answer" }), {
      key: "Enter",
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Evaluating…" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
  });

  it("submits from the form button", () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <PracticeComposer
        answer="A detailed answer"
        isSubmitting={false}
        onAnswerChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
