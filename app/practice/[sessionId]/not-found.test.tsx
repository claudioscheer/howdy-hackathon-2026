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
  });
});
