import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";

describe("Home Page", () => {
  it("renders the app badge", () => {
    render(<Home />);
    const badge = screen.getByTestId("app-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Howdy Dev Day 2026");
  });

  it("renders the hero title", () => {
    render(<Home />);
    const title = screen.getByTestId("hero-title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Howdy Interview Coach");
  });

  it("renders the hero description", () => {
    render(<Home />);
    const description = screen.getByTestId("hero-description");
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(/Adaptive mock interviews/i);
  });
});
