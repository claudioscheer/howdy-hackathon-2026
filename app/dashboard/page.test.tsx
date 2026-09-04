import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DashboardPage from "./page";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";

describe("DashboardPage", () => {
  it("renders header with brand, badge, and sign out link", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("brand-link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("dashboard-badge")).toHaveTextContent(
      DASHBOARD_PAGE.badge,
    );
    expect(screen.getByTestId("sign-out-link")).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders create opportunity button, stats overview cards, and disclaimer", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("create-opportunity-button")).toBeInTheDocument();
    expect(screen.getByTestId("stat-opportunities")).toBeInTheDocument();
    expect(screen.getByTestId("stat-links")).toBeInTheDocument();
    expect(screen.getByTestId("stat-limits")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-disclaimer")).toHaveTextContent(
      DASHBOARD_PAGE.disclaimer,
    );
  });

  it("renders opportunity cards with active and expired statuses", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("opportunity-card-opp-1")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-opp-1")).toHaveTextContent(
      "Expired",
    );
    expect(screen.getByTestId("action-link-opp-1")).toBeDisabled();

    expect(screen.getByTestId("opportunity-card-opp-2")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-opp-2")).toHaveTextContent(
      "Active",
    );
    expect(screen.getByTestId("action-link-opp-2")).not.toBeDisabled();
  });
});
