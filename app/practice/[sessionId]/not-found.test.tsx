import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PracticeNotFound from "./not-found";

describe("PracticeNotFound", () => {
  it("explains the invalid seed and links back to the dashboard", () => {
    render(<PracticeNotFound />);

    expect(
      screen.getByRole("heading", {
        name: "This seeded session is not available.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByTestId("practice-not-found-dashboard-link"),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("does not name a specific opportunity for an unknown session", () => {
    const { container } = render(<PracticeNotFound />);

    expect(container).not.toHaveTextContent(/Fullstack|Product Engineer/);
    expect(container).toHaveTextContent("active opportunity");
  });
});
