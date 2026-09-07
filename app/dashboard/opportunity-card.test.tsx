import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OpportunityCard, StatCard } from "./opportunity-card";

describe("Dashboard Opportunity and Stat cards", () => {
  it("renders StatCard with label and value", () => {
    render(<StatCard label="Roles" value="3" testId="test-stat" />);
    const card = screen.getByTestId("test-stat");
    expect(card).toHaveTextContent("Roles");
    expect(card).toHaveTextContent("3");
  });

  it("renders the seeded active opportunity as a practice link", () => {
    render(
      <OpportunityCard
        item={{
          id: "test-active",
          role: "Test Engineer",
          track: "Backend",
          attemptsLimit: 2,
          attemptsUsed: 0,
          status: "Active",
          token: "test-token",
          practiceSessionId: "test-session",
        }}
      />,
    );
    expect(
      screen.getByTestId("opportunity-card-test-active"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-test-active")).toHaveTextContent(
      "Active",
    );
    expect(screen.getByTestId("action-link-test-active")).toHaveTextContent(
      "Open Practice Interview",
    );
    expect(screen.getByTestId("action-link-test-active")).toHaveAttribute(
      "href",
      "/practice/test-session",
    );
  });

  it("renders expired OpportunityCard with disabled button", () => {
    render(
      <OpportunityCard
        item={{
          id: "test-expired",
          role: "Test Engineer",
          track: "Backend",
          attemptsLimit: 2,
          attemptsUsed: 2,
          status: "Expired",
          token: "test-expired-token",
        }}
      />,
    );
    expect(screen.getByTestId("status-badge-test-expired")).toHaveTextContent(
      "Expired",
    );
    expect(screen.getByTestId("action-link-test-expired")).toHaveTextContent(
      "Link Expired",
    );
    expect(screen.getByTestId("action-link-test-expired")).toBeDisabled();
  });

  it("does not offer a practice action without a seeded session", () => {
    render(
      <OpportunityCard
        item={{
          id: "test-unavailable",
          role: "Test Engineer",
          track: "Backend",
          attemptsLimit: 2,
          attemptsUsed: 0,
          status: "Active",
          token: "test-token",
        }}
      />,
    );
    expect(
      screen.getByTestId("action-link-test-unavailable"),
    ).toHaveTextContent("Practice Unavailable");
    expect(screen.getByTestId("action-link-test-unavailable")).toBeDisabled();
  });
});
