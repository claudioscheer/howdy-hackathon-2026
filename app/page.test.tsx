import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";
import { LANDING } from "@/lib/ui/copy";

describe("Home page", () => {
  it("renders the badge, title, and description from copy", () => {
    render(<Home />);
    expect(screen.getByTestId("app-badge")).toHaveTextContent(LANDING.badge);
    expect(screen.getByTestId("hero-title")).toHaveTextContent(LANDING.title);
    expect(screen.getByTestId("hero-description")).toHaveTextContent(
      LANDING.description,
    );
  });

  it("renders the start-practice control and background elements", () => {
    render(<Home />);
    const start = screen.getByTestId("start-practice");
    expect(start).toHaveTextContent(LANDING.startPractice);
    expect(start).toHaveAttribute("href", "/login");
    expect(screen.getByTestId("landing-grid-bg")).toBeInTheDocument();
  });

  it("applies DESIGN.md styling classes", () => {
    render(<Home />);
    expect(screen.getByTestId("app-badge")).toHaveClass("uppercase");
    expect(screen.getByTestId("hero-title")).toHaveClass("uppercase");
    expect(screen.getByTestId("start-practice")).toHaveClass(
      "rounded-full",
      "border",
      "uppercase",
    );
  });
});
