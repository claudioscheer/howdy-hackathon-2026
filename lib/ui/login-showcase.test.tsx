import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoginShowcase } from "./login-showcase";

describe("LoginShowcase", () => {
  it("renders radar rings, soundwaves, and telemetry nodes", () => {
    render(<LoginShowcase />);
    expect(screen.getByTestId("login-showcase")).toBeInTheDocument();
    expect(screen.getByTestId("radar-ring")).toBeInTheDocument();
    expect(screen.getByTestId("soundwave-container")).toBeInTheDocument();
    const bars = screen.getAllByTestId("soundwave-bar");
    expect(bars.length).toBe(12);
    const nodes = screen.getAllByTestId("telemetry-node");
    expect(nodes.length).toBe(4);
    expect(nodes[0]).toHaveTextContent("RELEVANCE");
    expect(nodes[1]).toHaveTextContent("SPECIFICITY");
    expect(screen.getByTestId("showcase-headline")).toHaveTextContent(
      "Help your engineers succeed.",
    );
    expect(screen.getByTestId("showcase-subline")).toBeInTheDocument();
  });
});
