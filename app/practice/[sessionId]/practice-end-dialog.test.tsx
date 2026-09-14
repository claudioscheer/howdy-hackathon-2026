import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeEndDialog } from "./practice-end-dialog";

describe("PracticeEndDialog", () => {
  it("confirms or cancels ending the interview", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <PracticeEndDialog
        isSubmitting={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByTestId("end-interview-dialog")).toHaveTextContent(
      "insufficient evidence",
    );
    fireEvent.click(screen.getByTestId("end-interview-cancel"));
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables confirm while an answer is being evaluated", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <PracticeEndDialog
        isSubmitting
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByTestId("end-interview-confirm")).toBeDisabled();
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("end-interview-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
