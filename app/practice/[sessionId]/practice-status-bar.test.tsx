import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import { createSeededSession } from "@/lib/interview/seed";
import { PracticeStatusBar } from "./practice-status-bar";

describe("PracticeStatusBar", () => {
  it("shows progress, timer, follow-ups, and the end control", () => {
    const onEnd = vi.fn();
    const session = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    render(
      <PracticeStatusBar
        session={session}
        isComplete={false}
        elapsedSeconds={75}
        targetMinutes={40}
        isSubmitting={false}
        onEnd={onEnd}
      />,
    );
    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Question 1 of 3",
    );
    expect(screen.getByTestId("practice-timer")).toHaveTextContent(
      "01:15 / 40:00",
    );
    expect(screen.getByTestId("follow-up-count")).toHaveTextContent("0 of 2");
    fireEvent.click(screen.getByTestId("end-interview-button"));
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("hides follow-ups and end when complete", () => {
    const session = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    render(
      <PracticeStatusBar
        session={{ ...session, status: "COMPLETE" }}
        isComplete
        elapsedSeconds={12}
        targetMinutes={40}
        isSubmitting={false}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Interview complete",
    );
    expect(screen.queryByTestId("follow-up-count")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("end-interview-button"),
    ).not.toBeInTheDocument();
  });

  it("disables the end control while an answer is being evaluated", () => {
    const onEnd = vi.fn();
    const session = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    render(
      <PracticeStatusBar
        session={session}
        isComplete={false}
        elapsedSeconds={30}
        targetMinutes={40}
        isSubmitting
        onEnd={onEnd}
      />,
    );
    expect(screen.getByTestId("end-interview-button")).toBeDisabled();
    fireEvent.click(screen.getByTestId("end-interview-button"));
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("formats the target like the elapsed time and labels the role", () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const session = {
      ...started,
      opportunity: {
        ...started.opportunity,
        role: "fullstack",
        seniority: "senior",
      },
    };
    render(
      <PracticeStatusBar
        session={session}
        isComplete={false}
        elapsedSeconds={30}
        targetMinutes={5}
        isSubmitting={false}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByTestId("practice-timer")).toHaveTextContent(
      /^00:30 \/ 05:00$/,
    );
    expect(
      screen.getByText(/^Senior Full stack · Attempt 1 of 2$/),
    ).toBeInTheDocument();
  });
});
