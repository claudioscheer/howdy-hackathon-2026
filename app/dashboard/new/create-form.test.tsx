import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";

const createOpportunityAction = vi.hoisted(() =>
  vi.fn(async () => ({ errors: { role: "Enter a role." } })),
);

vi.mock("../actions", () => ({
  createOpportunityAction,
}));

import { CreateOpportunityForm } from "./create-form";

describe("CreateOpportunityForm", () => {
  beforeEach(() => {
    createOpportunityAction.mockReset();
    createOpportunityAction.mockResolvedValue({
      errors: { role: "Enter a role." },
    });
  });

  it("renders labeled fields and the save button", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByTestId("create-opportunity-form")).toBeInTheDocument();
    expect(
      screen.getByTestId("candidateDisplayName-input"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("role-input")).toHaveValue("fullstack");
    expect(screen.getByTestId("seniority-input")).toHaveValue("senior");
    expect(screen.getByTestId("candidateDisplayName-input")).toBeRequired();
    expect(screen.getByTestId("targetTechStack-input")).not.toBeRequired();
    expect(screen.getByTestId("jobDescription-input")).toBeRequired();
    expect(screen.getByTestId("curriculum-input")).toBeRequired();
    expect(screen.getByTestId("role-chevron")).toBeInTheDocument();
    expect(screen.getByTestId("interviewType-input")).toHaveValue("behavioral");
    expect(screen.getByTestId("jobDescription-input")).toBeInTheDocument();
    expect(screen.getByTestId("curriculum-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-opportunity-submit")).toHaveTextContent(
      CREATE_OPPORTUNITY_PAGE.submitButton,
    );
  });

  it("includes a hidden opportunity id when editing", () => {
    render(
      <CreateOpportunityForm
        opportunityId="opp-2"
        submitLabel={CREATE_OPPORTUNITY_PAGE.saveEditsButton}
      />,
    );
    expect(screen.getByTestId("create-opportunity-submit")).toHaveTextContent(
      CREATE_OPPORTUNITY_PAGE.saveEditsButton,
    );
  });

  it("shows field errors returned by the server action", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.submit(screen.getByTestId("create-opportunity-form"));
    expect(await screen.findByTestId("field-error-role")).toHaveTextContent(
      "Enter a role.",
    );
  });

  it("shows a form-level error when save fails", async () => {
    createOpportunityAction.mockResolvedValue({
      errors: { form: "Could not save this opportunity. Try again." },
    });
    render(<CreateOpportunityForm />);
    fireEvent.submit(screen.getByTestId("create-opportunity-form"));
    expect(await screen.findByTestId("field-error-form")).toHaveTextContent(
      "Could not save this opportunity. Try again.",
    );
  });

  it("shows the pending label while the action is in flight", async () => {
    createOpportunityAction.mockImplementation(
      () => new Promise(() => undefined),
    );
    render(<CreateOpportunityForm />);
    fireEvent.submit(screen.getByTestId("create-opportunity-form"));
    await waitFor(() => {
      expect(screen.getByTestId("create-opportunity-submit")).toHaveTextContent(
        CREATE_OPPORTUNITY_PAGE.pendingButton,
      );
    });
  });
});
