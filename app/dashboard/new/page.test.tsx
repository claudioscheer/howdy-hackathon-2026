import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";

vi.mock("./create-form", () => ({
  CreateOpportunityForm: function MockForm(): React.JSX.Element {
    return <div data-testid="create-opportunity-form" />;
  },
}));

import CreateOpportunityPage from "./page";

describe("CreateOpportunityPage", () => {
  it("renders the create heading, description, and back link", () => {
    render(<CreateOpportunityPage />);
    expect(screen.getByTestId("create-opportunity-title")).toHaveTextContent(
      CREATE_OPPORTUNITY_PAGE.title,
    );
    expect(
      screen.getByTestId("create-opportunity-description"),
    ).toHaveTextContent(CREATE_OPPORTUNITY_PAGE.description);
    expect(screen.getByTestId("back-to-dashboard-link")).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByTestId("create-opportunity-form")).toBeInTheDocument();
  });
});
