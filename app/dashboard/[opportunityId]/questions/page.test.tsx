import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getQuestionPrepStatus = vi.hoisted(() => vi.fn());
const listPlannedQuestions = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("@/lib/db/questions", () => ({
  getQuestionPrepStatus,
  listPlannedQuestions,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("./generate-panel", () => ({
  GenerateQuestionsPanel: function MockGenerate(): React.JSX.Element {
    return <div data-testid="generate-questions-form" />;
  },
  GeneratingQuestionsStatus: function MockStatus(): React.JSX.Element {
    return <div data-testid="generating-questions-status" />;
  },
}));

vi.mock("./review-form", () => ({
  ReviewQuestionsForm: function MockReview(): React.JSX.Element {
    return <div data-testid="review-questions-form" />;
  },
}));

import QuestionsPage from "./page";

describe("QuestionsPage", () => {
  it("shows generate when no questions exist", async () => {
    getQuestionPrepStatus.mockResolvedValue("idle");
    listPlannedQuestions.mockResolvedValue([]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("questions-page-title")).toHaveTextContent(
      "Prepare questions",
    );
    expect(screen.getByTestId("generate-questions-form")).toBeInTheDocument();
  });

  it("shows the generating status", async () => {
    getQuestionPrepStatus.mockResolvedValue("generating");
    listPlannedQuestions.mockResolvedValue([]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(
      screen.getByTestId("generating-questions-status"),
    ).toBeInTheDocument();
  });

  it("shows review when questions are ready", async () => {
    getQuestionPrepStatus.mockResolvedValue("ready");
    listPlannedQuestions.mockResolvedValue([{ prompt: "Why this role?" }]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("questions-page-title")).toHaveTextContent(
      "Review questions",
    );
    expect(screen.getByTestId("review-questions-form")).toBeInTheDocument();
  });

  it("uses not-found when the opportunity is missing", async () => {
    getQuestionPrepStatus.mockResolvedValue(null);
    await expect(
      QuestionsPage({
        params: Promise.resolve({ opportunityId: "missing" }),
      }),
    ).rejects.toThrow("not found");
  });
});
