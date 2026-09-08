import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { OpportunityCard, StatCard } from "./opportunity-card";

function item(overrides: Partial<OpportunityItem> = {}): OpportunityItem {
  return {
    id: "test-active",
    role: "backend",
    seniority: "senior",
    track: "Backend",
    attemptsLimit: 2,
    attemptsUsed: 0,
    status: "Active",
    token: "test-token",
    hasBriefing: false,
    questionCount: 0,
    questionPrepStatus: "idle",
    ...overrides,
  };
}

describe("Dashboard Opportunity and Stat cards", () => {
  it("renders StatCard with label and value", () => {
    render(<StatCard label="Roles" value="3" testId="test-stat" />);
    const card = screen.getByTestId("test-stat");
    expect(card).toHaveTextContent("Roles");
    expect(card).toHaveTextContent("3");
  });

  it("renders manager actions instead of a practice interview link", () => {
    render(
      <OpportunityCard item={item({ practiceSessionId: "test-session" })} />,
    );
    expect(
      screen.getByTestId("opportunity-card-test-active"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-test-active")).toHaveTextContent(
      "Active",
    );
    expect(screen.getByTestId("edit-opportunity-test-active")).toHaveAttribute(
      "href",
      "/dashboard/test-active/edit",
    );
    expect(
      screen.getByTestId("questions-opportunity-test-active"),
    ).toHaveTextContent("Generate questions");
    expect(
      screen.getByTestId("opportunity-card-test-active"),
    ).toHaveTextContent("Senior Backend");
  });

  it("renders the candidate name when present", () => {
    render(
      <OpportunityCard
        item={item({
          id: "test-candidate",
          role: "fullstack",
          seniority: "medium",
          candidateName: "Alex Rivera",
          hasBriefing: true,
          status: "Draft",
        })}
      />,
    );
    expect(
      screen.getByTestId("candidate-name-test-candidate"),
    ).toHaveTextContent("Candidate: Alex Rivera");
    expect(screen.getByTestId("status-badge-test-candidate")).toHaveTextContent(
      "Draft",
    );
    expect(screen.getByTestId("briefing-test-candidate")).toHaveTextContent(
      "Job description and curriculum on file",
    );
  });

  it("renders expired OpportunityCard with review actions", () => {
    render(
      <OpportunityCard
        item={item({
          id: "test-expired",
          role: "infrastructure",
          seniority: "staff",
          status: "Expired",
          attemptsUsed: 2,
          questionCount: 3,
          questionPrepStatus: "ready",
        })}
      />,
    );
    expect(screen.getByTestId("status-badge-test-expired")).toHaveTextContent(
      "Expired",
    );
    expect(
      screen.getByTestId("questions-opportunity-test-expired"),
    ).toHaveTextContent("Review questions");
  });

  it("hides an empty tech-stack line", () => {
    render(
      <OpportunityCard
        item={item({
          id: "test-unavailable",
          role: "frontend",
          seniority: "junior",
          track: "",
        })}
      />,
    );
    expect(
      screen.getByTestId("opportunity-card-test-unavailable"),
    ).not.toHaveTextContent("Backend");
  });
});
