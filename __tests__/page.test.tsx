import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";
import { LANDING, practiceButtonLabel } from "@/lib/ui/copy";

describe("landing copy contract", () => {
  it("keeps the practice button label stable", () => {
    expect(practiceButtonLabel()).toBe("Start practice");
  });
});

describe("Home Page", () => {
  it("renders the app badge from copy", () => {
    render(<Home />);
    const badge = screen.getByTestId("app-badge");
    expect(badge).toHaveTextContent(LANDING.badge);
  });

  it("renders the hero title from copy", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-title")).toHaveTextContent(LANDING.title);
  });

  it("renders the hero description from copy", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-description")).toHaveTextContent(
      LANDING.description
    );
  });

  it("renders a start-practice control agents can target", () => {
    render(<Home />);
    const start = screen.getByTestId("start-practice");
    expect(start).toHaveTextContent(LANDING.startPractice);
    expect(start).toHaveAttribute("href", "#practice");
  });

  it("tells agents how to finish work", () => {
    render(<Home />);
    expect(screen.getByTestId("harness-hint")).toHaveTextContent(
      LANDING.harnessHint
    );
  });
});
