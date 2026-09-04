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

  it("renders active OpportunityCard with enabled button", () => {
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
      "Copy Practice Link",
    );
    expect(screen.getByTestId("action-link-test-active")).not.toBeDisabled();
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
});
