import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScriptedAnswerEvaluator } from "@/lib/interview/evaluator";
import { sessionReducer } from "@/lib/interview/reducer";
import {
  SEEDED_SESSION_ID,
  SEEDED_QUESTION_PLAN,
  createSeededSession,
} from "@/lib/interview/seed";
import * as turnRuntime from "@/lib/interview/turn";
import { PracticeClient } from "./practice-client";

const concreteAnswer =
  "I disagreed with a teammate on an API design decision, considered the tradeoffs, reduced delivery risk, and shipped the product change by 40 percent.";

function renderPractice(): void {
  render(
    <PracticeClient
      initialState={sessionReducer(createSeededSession(SEEDED_SESSION_ID), {
        type: "START_SESSION",
      })}
    />,
  );
}

function answerAndSubmit(answer: string): void {
  fireEvent.change(screen.getByRole("textbox", { name: "Your answer" }), {
    target: { value: answer },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));
}

describe("PracticeClient", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the seeded question, progress, and opening transcript", () => {
    renderPractice();

    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Question 1 of 3",
    );
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      SEEDED_QUESTION_PLAN[0].prompt,
    );
    expect(screen.getByLabelText("Interview transcript")).toHaveTextContent(
      SEEDED_QUESTION_PLAN[0].prompt,
    );
    expect(screen.getByTestId("follow-up-count")).toHaveTextContent("0 of 2");
  });

  it("validates empty input without changing the transcript", () => {
    renderPractice();
    answerAndSubmit("   ");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an answer before continuing.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("shows specificity pressure for a vague answer, then advances for a concrete answer", async () => {
    renderPractice();

    answerAndSubmit(
      "I had a disagreement with a teammate but we figured it out.",
    );
    expect(
      await screen.findAllByText(/Can you make that more specific/i),
    ).toHaveLength(2);
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      /Can you make that more specific/i,
    );
    expect(screen.getByTestId("follow-up-count")).toHaveTextContent("1 of 2");
    expect(screen.getByLabelText("Interview transcript")).toHaveTextContent(
      "I had a disagreement with a teammate but we figured it out.",
    );

    answerAndSubmit(concreteAnswer);
    await waitFor(() =>
      expect(screen.getByTestId("question-progress")).toHaveTextContent(
        "Question 2 of 3",
      ),
    );
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      SEEDED_QUESTION_PLAN[1].prompt,
    );
    expect(screen.getByLabelText("Interview transcript")).toHaveTextContent(
      concreteAnswer,
    );
    expect(screen.getByRole("textbox", { name: "Your answer" })).toHaveValue(
      "",
    );
  });

  it("keeps the visible state intact when evaluation fails", async () => {
    vi.spyOn(
      ScriptedAnswerEvaluator.prototype,
      "evaluate",
    ).mockRejectedValueOnce(new Error("offline"));
    renderPractice();

    answerAndSubmit("A candidate answer that cannot be evaluated.");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The evaluator could not evaluate the answer.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Question 1 of 3",
    );
  });

  it("handles an unexpected turn-coordination rejection safely", async () => {
    vi.spyOn(turnRuntime, "submitAnswer").mockRejectedValueOnce(
      new Error("unexpected"),
    );
    renderPractice();

    answerAndSubmit(concreteAnswer);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your answer could not be evaluated. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Submit answer" })).toBeEnabled();
  });

  it("renders the terminal state after the final question", async () => {
    renderPractice();

    for (let questionIndex = 1; questionIndex <= 3; questionIndex += 1) {
      answerAndSubmit(concreteAnswer);
      const expectedProgress =
        questionIndex === 3
          ? "Interview complete"
          : `Question ${questionIndex + 1} of 3`;
      await waitFor(() =>
        expect(screen.getByTestId("question-progress")).toHaveTextContent(
          expectedProgress,
        ),
      );
    }

    expect(screen.getByTestId("current-question")).toHaveTextContent(
      "You completed this practice interview.",
    );
    expect(
      screen.queryByRole("textbox", { name: "Your answer" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("follow-up-count")).not.toBeInTheDocument();
  });
});
