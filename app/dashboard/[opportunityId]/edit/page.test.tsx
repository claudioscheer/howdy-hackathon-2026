import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getOpportunityForEdit = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("@/lib/db/opportunity-write", () => ({
  getOpportunityForEdit,
  toCreateInput: () => ({
    candidateDisplayName: "Alex Rivera",
    role: "fullstack",
    seniority: "senior",
    targetTechStack: ["React"],
    interviewType: "behavioral",
    jobDescription: "Ship product work.",
    curriculum: "Resume text",
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("../../new/create-form", () => ({
  CreateOpportunityForm: function MockForm(): React.JSX.Element {
    return <div data-testid="create-opportunity-form" />;
  },
}));

import EditOpportunityPage from "./page";

describe("EditOpportunityPage", () => {
  it("renders the edit title when the opportunity exists", async () => {
    getOpportunityForEdit.mockResolvedValue({ id: "opp-2" });
    render(
      await EditOpportunityPage({
        params: Promise.resolve({ opportunityId: "opp-2" }),
      }),
    );
    expect(screen.getByTestId("edit-opportunity-title")).toHaveTextContent(
      "Edit Opportunity",
    );
    expect(screen.getByTestId("create-opportunity-form")).toBeInTheDocument();
  });

  it("uses the not-found boundary when missing", async () => {
    getOpportunityForEdit.mockResolvedValue(null);
    await expect(
      EditOpportunityPage({
        params: Promise.resolve({ opportunityId: "missing" }),
      }),
    ).rejects.toThrow("not found");
  });
});
