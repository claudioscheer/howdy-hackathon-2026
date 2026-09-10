import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getOpportunityQuestionPrep = vi.hoisted(() => vi.fn());
const listPlannedQuestions = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("@/lib/db/questions", () => ({
  getOpportunityQuestionPrep,
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

const prep = {
  status: "idle" as const,
  targetMinutes: 40,
  sessionAnswerBudget: 10,
  practiceSessionId: "opp-2",
  interviewType: "behavioral" as const,
};

describe("QuestionsPage", () => {
  it("shows generate and an empty review form when no questions exist", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(prep);
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
    expect(screen.getByTestId("review-questions-form")).toBeInTheDocument();
  });

  it("shows the generating status", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      ...prep,
      status: "generating",
    });
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
    getOpportunityQuestionPrep.mockResolvedValue({
      ...prep,
      status: "ready",
    });
    listPlannedQuestions.mockResolvedValue([
      {
        prompt: "Why this role?",
        primaryDimension: "specificity",
        importance: "core",
        competency: "Ownership",
        brief: null,
      },
    ]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("questions-page-title")).toHaveTextContent(
      "Review questions",
    );
    expect(screen.getByTestId("review-questions-form")).toBeInTheDocument();
    expect(screen.getByTestId("open-practice-link")).toHaveAttribute(
      "href",
      "/practice/opp-2",
    );
    getOpportunityQuestionPrep.mockResolvedValue({
      ...prep,
      status: "ready",
      practiceSessionId: null,
    });
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getAllByTestId("open-practice-link")[1]).toHaveAttribute(
      "href",
      "/practice/opp-2",
    );
  });

  it("maps prompt-only rows without inventing importance", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      ...prep,
      status: "ready",
    });
    listPlannedQuestions.mockResolvedValue([
      {
        prompt: "Prompt only?",
        primaryDimension: "specificity",
        importance: null,
        competency: null,
        brief: null,
      },
    ]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("review-questions-form")).toBeInTheDocument();
  });

  it("maps a stored brief when importance columns are empty", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      ...prep,
      status: "ready",
    });
    listPlannedQuestions.mockResolvedValue([
      {
        prompt: "Walk through an outage.",
        primaryDimension: "specificity",
        importance: null,
        competency: null,
        brief: {
          competency: "Incidents",
          roleRelevance: "The role owns uptime.",
          importance: "supporting",
          expectedDepth: "A recent incident.",
          evidenceToListenFor: ["owned action"],
          followUpTriggers: ["missing ownership"],
          timeBudgetMinutes: 5,
          answerBudget: 2,
          maxFollowUps: 1,
          stopWhen: ["an incident is described"],
        },
      },
    ]);
    render(
      await QuestionsPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("review-questions-form")).toBeInTheDocument();
  });

  it("uses not-found when the opportunity is missing", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(null);
    await expect(
      QuestionsPage({
        params: Promise.resolve({ opportunityId: "missing" }),
      }),
    ).rejects.toThrow("not found");
  });
});
