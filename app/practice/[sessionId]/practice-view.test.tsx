import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import { createSeededSession } from "@/lib/interview/seed";
import type { SessionState } from "@/lib/interview/session";
import {
  AnswerForm,
  CurrentQuestion,
  PracticeHeader,
  Transcript,
} from "./practice-view";

function startedSession(): SessionState {
  return sessionReducer(createSeededSession(), { type: "START_SESSION" });
}

describe("practice view", () => {
  it("renders active session context and transcript roles", () => {
    const session = startedSession();
    const withCandidateTurn: SessionState = {
      ...session,
      history: [
        ...session.history,
        {
          id: "candidate-turn",
          questionId: session.questions[0].id,
          speaker: "candidate",
          kind: "answer",
          content: "I discussed the tradeoff with my teammate.",
        },
      ],
    };

    render(
      <>
        <PracticeHeader session={withCandidateTurn} isComplete={false} />
        <CurrentQuestion session={withCandidateTurn} />
        <Transcript session={withCandidateTurn} />
      </>,
    );

    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Question 1 of 3",
    );
    expect(screen.getByTestId("follow-up-count")).toHaveTextContent("0 of 2");
    expect(screen.getByLabelText("Interview transcript")).toHaveTextContent(
      "candidate",
    );
  });

  it("renders the completed session state", () => {
    const session = startedSession();
    const completeSession: SessionState = {
      ...session,
      status: "COMPLETE",
      questionIndex: session.questions.length,
    };

    render(
      <>
        <PracticeHeader session={completeSession} isComplete />
        <CurrentQuestion session={completeSession} />
      </>,
    );

    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Interview complete",
    );
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      "You completed this practice interview.",
    );
    expect(screen.queryByTestId("follow-up-count")).not.toBeInTheDocument();
  });

  it("connects answer form controls to their handlers", () => {
    const onAnswerChange = vi.fn();
    const onSubmit = vi.fn(async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    render(
      <AnswerForm
        answer=""
        error="Try again."
        isSubmitting={false}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Your answer" }), {
      target: { value: "A detailed answer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(onAnswerChange).toHaveBeenCalledWith("A detailed answer");
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
  });

  it("shows the evaluating state", () => {
    render(
      <AnswerForm
        answer="Pending answer"
        isSubmitting
        onAnswerChange={vi.fn()}
        onSubmit={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Your answer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Evaluating…" })).toBeDisabled();
  });
});
