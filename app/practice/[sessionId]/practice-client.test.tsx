import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import {
  SEEDED_QUESTION_PLAN,
  createSeededSession,
} from "@/lib/interview/seed";
import { PracticeClient } from "./practice-client";

const submitPracticeAnswerAction = vi.hoisted(() => vi.fn());
const endPracticeAction = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({
  submitPracticeAnswerAction,
  endPracticeAction,
}));

const concreteAnswer =
  "I disagreed with a teammate on an API design decision, considered the tradeoffs, reduced delivery risk, and shipped the product change by 40 percent.";

function renderPractice(): void {
  render(
    <PracticeClient initialState={createSeededSession()} targetMinutes={40} />,
  );
}

function startInterview(): void {
  fireEvent.click(screen.getByTestId("start-interview-button"));
}

function answerAndSubmit(answer: string): void {
  fireEvent.change(screen.getByRole("textbox", { name: "Your answer" }), {
    target: { value: answer },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));
}

describe("PracticeClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    submitPracticeAnswerAction.mockReset();
    endPracticeAction.mockReset();
  });

  it("keeps the briefing until start, then shows the first question", () => {
    renderPractice();
    expect(screen.queryByTestId("practice-timer")).not.toBeInTheDocument();
    startInterview();
    expect(screen.getByTestId("question-progress")).toHaveTextContent(
      "Question 1 of 3",
    );
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      SEEDED_QUESTION_PLAN[0].prompt,
    );
    expect(screen.getByTestId("practice-timer")).toHaveTextContent(
      "00:00 / 40:00",
    );
  });

  it("forwards mock mode to the answer action", async () => {
    submitPracticeAnswerAction.mockResolvedValue({
      ok: true,
      state: sessionReducer(createSeededSession(), { type: "START_SESSION" }),
    });
    render(
      <PracticeClient
        initialState={createSeededSession()}
        targetMinutes={40}
        mock
      />,
    );
    startInterview();
    answerAndSubmit(concreteAnswer);
    await waitFor(() =>
      expect(submitPracticeAnswerAction).toHaveBeenCalledWith(
        expect.objectContaining({ status: "AWAITING_ANSWER" }),
        concreteAnswer,
        expect.any(Number),
        true,
      ),
    );
  });

  it("validates empty input without changing the transcript", () => {
    renderPractice();
    startInterview();
    answerAndSubmit("   ");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an answer before continuing.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("shows a follow-up then advances after a concrete answer", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    submitPracticeAnswerAction
      .mockResolvedValueOnce({
        ok: true,
        state: {
          ...started,
          followUpCount: 1,
          history: [
            ...started.history,
            {
              id: "a1",
              questionId: started.questions[0].id,
              speaker: "candidate",
              kind: "answer",
              content:
                "I had a disagreement with a teammate but we figured it out.",
            },
            {
              id: "f1",
              questionId: started.questions[0].id,
              speaker: "interviewer",
              kind: "follow_up",
              content: "Can you make that more specific?",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        state: {
          ...started,
          questionIndex: 1,
          followUpCount: 0,
          history: [
            ...started.history,
            {
              id: "a2",
              questionId: started.questions[0].id,
              speaker: "candidate",
              kind: "answer",
              content: concreteAnswer,
            },
            {
              id: "q2",
              questionId: started.questions[1].id,
              speaker: "interviewer",
              kind: "question",
              content: SEEDED_QUESTION_PLAN[1].prompt,
            },
          ],
        },
      });
    renderPractice();
    startInterview();
    answerAndSubmit(
      "I had a disagreement with a teammate but we figured it out.",
    );
    expect(
      await screen.findByText(/Can you make that more specific/i),
    ).toBeInTheDocument();
    answerAndSubmit(concreteAnswer);
    await waitFor(() =>
      expect(screen.getByTestId("question-progress")).toHaveTextContent(
        "Question 2 of 3",
      ),
    );
  });

  it("keeps the visible state intact when evaluation fails", async () => {
    submitPracticeAnswerAction.mockResolvedValueOnce({
      ok: false,
      error: "The evaluator could not evaluate the answer.",
    });
    renderPractice();
    startInterview();
    answerAndSubmit("A candidate answer that cannot be evaluated.");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The evaluator could not evaluate the answer.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("handles an unexpected turn-coordination rejection safely", async () => {
    submitPracticeAnswerAction.mockRejectedValueOnce(new Error("unexpected"));
    renderPractice();
    startInterview();
    answerAndSubmit(concreteAnswer);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your answer could not be evaluated. Please try again.",
    );
  });

  it("disables End while an answer is being evaluated", async () => {
    let settle: (value: { ok: false; error: string }) => void = () => undefined;
    submitPracticeAnswerAction.mockReturnValueOnce(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderPractice();
    startInterview();
    fireEvent.click(screen.getByTestId("end-interview-button"));
    answerAndSubmit(concreteAnswer);
    expect(screen.getByTestId("end-interview-button")).toBeDisabled();
    expect(screen.getByTestId("end-interview-confirm")).toBeDisabled();
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(endPracticeAction).not.toHaveBeenCalled();
    settle({ ok: false, error: "Evaluation failed." });
    await waitFor(() =>
      expect(screen.getByTestId("end-interview-button")).toBeEnabled(),
    );
    expect(submitPracticeAnswerAction).toHaveBeenCalledOnce();
  });

  it("cancels end-interview and confirms it to generate a report", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    endPracticeAction.mockResolvedValue({
      ok: true,
      state: {
        ...started,
        status: "COMPLETE",
        report: {
          attemptNumber: 1,
          summary: "Ended early.",
          dimensions: {
            relevance: {
              status: "insufficient_evidence",
              summary: "Not enough evidence.",
              evidence: [],
              remainingUnknown: "Ended early.",
            },
            specificity: {
              status: "insufficient_evidence",
              summary: "Not enough evidence.",
              evidence: [],
              remainingUnknown: "Ended early.",
            },
            fundamentals: {
              status: "insufficient_evidence",
              summary: "Not enough evidence.",
              evidence: [],
              remainingUnknown: "Ended early.",
            },
            structure: {
              status: "insufficient_evidence",
              summary: "Not enough evidence.",
              evidence: [],
              remainingUnknown: "Ended early.",
            },
          },
        },
      },
    });
    renderPractice();
    startInterview();
    fireEvent.click(screen.getByTestId("end-interview-button"));
    fireEvent.click(screen.getByTestId("end-interview-cancel"));
    expect(
      screen.queryByTestId("end-interview-dialog"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("end-interview-button"));
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(await screen.findByTestId("practice-report")).toHaveTextContent(
      "Ended early.",
    );
  });

  it("surfaces end-interview failures", async () => {
    endPracticeAction.mockResolvedValueOnce({
      ok: false,
      error: "The interview can only be ended while waiting for an answer.",
    });
    renderPractice();
    startInterview();
    fireEvent.click(screen.getByTestId("end-interview-button"));
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The interview can only be ended while waiting for an answer.",
    );
    endPracticeAction.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByTestId("end-interview-button"));
    fireEvent.click(screen.getByTestId("end-interview-confirm"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your answer could not be evaluated. Please try again.",
    );
  });
});
