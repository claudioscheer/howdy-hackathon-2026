import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import {
  createSeededSession,
  SEEDED_QUESTION_PLAN,
} from "@/lib/interview/seed";
import { PracticeChatThread } from "./practice-chat-thread";

describe("PracticeChatThread", () => {
  it("prefixes a greeting onto the first interviewer question", () => {
    const session = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    render(<PracticeChatThread session={session} />);
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      "Welcome to your practice interview",
    );
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      SEEDED_QUESTION_PLAN[0].prompt,
    );
  });

  it("does not prefix later interviewer turns", () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const session = {
      ...started,
      history: [
        ...started.history,
        {
          id: "follow",
          questionId: started.questions[0].id,
          speaker: "interviewer" as const,
          kind: "follow_up" as const,
          content: "Can you make that more specific?",
        },
      ],
    };
    render(<PracticeChatThread session={session} />);
    expect(screen.getByTestId("current-question")).toHaveTextContent(
      "Can you make that more specific?",
    );
    expect(screen.getByTestId("current-question")).not.toHaveTextContent(
      "Welcome to your practice interview",
    );
  });
});
