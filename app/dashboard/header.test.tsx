import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardHeader } from "./header";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";

describe("DashboardHeader", () => {
  it("renders brand, badge, and sign out link", () => {
    render(<DashboardHeader />);
    expect(screen.getByTestId("brand-link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("dashboard-badge")).toHaveTextContent(
      DASHBOARD_PAGE.badge,
    );
    expect(screen.getByTestId("sign-out-link")).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
