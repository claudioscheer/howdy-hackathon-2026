import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";
import type { OpportunityItem } from "@/lib/db/opportunity-item";

const listDashboardOpportunities = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/opportunities", () => ({
  listDashboardOpportunities,
}));

import DashboardPage from "./page";

const SEEDED_ITEMS: OpportunityItem[] = [
  {
    id: "opp-1",
    role: "infrastructure",
    seniority: "senior",
    track: "Go, Kubernetes, PostgreSQL",
    attemptsLimit: 2,
    attemptsUsed: 2,
    status: "Expired",
    token: "sys-9f82a",
    hasBriefing: true,
    questionCount: 0,
    questionPrepStatus: "idle",
  },
  {
    id: "opp-2",
    role: "fullstack",
    seniority: "senior",
    track: "React, Node.js, PostgreSQL",
    attemptsLimit: 2,
    attemptsUsed: 0,
    status: "Active",
    token: "fs-3b17c",
    practiceSessionId: "fullstack-product-engineer",
    candidateName: "Alex Rivera",
    hasBriefing: true,
    questionCount: 0,
    questionPrepStatus: "idle",
  },
];

describe("DashboardPage", () => {
  beforeEach(() => {
    listDashboardOpportunities.mockReset();
  });

  it("renders header with brand, badge, and sign out link", async () => {
    listDashboardOpportunities.mockResolvedValue(SEEDED_ITEMS);
    render(await DashboardPage());
    expect(screen.getByTestId("brand-link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("dashboard-badge")).toHaveTextContent(
      DASHBOARD_PAGE.badge,
    );
    expect(screen.getByTestId("sign-out-link")).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders create opportunity link, stats, and disclaimer", async () => {
    listDashboardOpportunities.mockResolvedValue(SEEDED_ITEMS);
    render(await DashboardPage());
    expect(screen.getByTestId("create-opportunity-button")).toHaveAttribute(
      "href",
      "/dashboard/new",
    );
    expect(screen.getByTestId("stat-opportunities")).toHaveTextContent(
      "2 Roles",
    );
    expect(screen.getByTestId("stat-links")).toHaveTextContent("1 Available");
    expect(screen.getByTestId("stat-limits")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-disclaimer")).toHaveTextContent(
      DASHBOARD_PAGE.disclaimer,
    );
  });

  it("renders opportunity cards with active and expired statuses", async () => {
    listDashboardOpportunities.mockResolvedValue(SEEDED_ITEMS);
    render(await DashboardPage());
    expect(screen.getByTestId("opportunity-card-opp-1")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-opp-1")).toHaveTextContent(
      "Expired",
    );
    expect(screen.getByTestId("edit-opportunity-opp-1")).toHaveAttribute(
      "href",
      "/dashboard/opp-1/edit",
    );

    expect(screen.getByTestId("opportunity-card-opp-2")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-opp-2")).toHaveTextContent(
      "Active",
    );
    expect(screen.getByTestId("questions-opportunity-opp-2")).toHaveAttribute(
      "href",
      "/dashboard/opp-2/questions",
    );
  });

  it("renders an empty state when no opportunities are stored", async () => {
    listDashboardOpportunities.mockResolvedValue([]);
    render(await DashboardPage());
    expect(screen.getByTestId("dashboard-empty-state")).toHaveTextContent(
      DASHBOARD_PAGE.emptyState,
    );
    expect(screen.getByTestId("stat-opportunities")).toHaveTextContent(
      "0 Roles",
    );
  });
});
