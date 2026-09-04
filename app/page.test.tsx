import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";
import { LANDING } from "@/lib/ui/copy";

describe("Home page", () => {
  it("renders the badge, question, and sell line from copy", () => {
    render(<Home />);
    expect(screen.getByTestId("app-badge")).toHaveTextContent(LANDING.badge);
    expect(screen.getByTestId("product-wordmark")).toHaveTextContent(
      LANDING.product,
    );
    const hero = screen.getByTestId("hero-title").textContent ?? "";
    expect(LANDING.questions.some((question) => hero.includes(question))).toBe(
      true,
    );
    expect(screen.getByTestId("hero-description")).toHaveTextContent(
      LANDING.description,
    );
  });

  it("sends the visitor to login and keeps location chrome off the page", () => {
    const { container } = render(<Home />);
    const start = screen.getByTestId("start-practice");
    expect(start).toHaveTextContent(LANDING.startPractice);
    expect(start).toHaveAttribute("href", "/login");
    expect(container.textContent).not.toContain("28.5721");
    expect(container.textContent).not.toContain("SYS.LOC");
    expect(
      screen.queryByTestId("telemetry-signal-meter"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("precision-axis-scale"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("landing-grid-bg")).toBeInTheDocument();
  });

  it("applies DESIGN.md styling classes", () => {
    render(<Home />);
    expect(screen.getByTestId("app-badge")).toHaveClass("uppercase", "sr-only");
    expect(screen.getByTestId("hero-title")).toHaveClass("uppercase");
    expect(screen.getByTestId("start-practice")).toHaveClass(
      "rounded-full",
      "border",
      "uppercase",
    );
  });
});
