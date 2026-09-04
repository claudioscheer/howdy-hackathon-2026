import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LOGIN_PAGE } from "./copy";
import { LoginShowcase, SHOWCASE_CASCADE } from "./login-showcase";

describe("LoginShowcase", () => {
  it("renders the word cascade and a plain supporting line", () => {
    render(<LoginShowcase />);
    expect(screen.getByTestId("login-showcase")).toBeInTheDocument();
    expect(screen.getByTestId("showcase-headline")).toHaveTextContent(
      LOGIN_PAGE.showcaseHeadline,
    );
    expect(screen.getByTestId("showcase-subline")).toHaveTextContent(
      LOGIN_PAGE.showcaseSubline,
    );
    expect(screen.getByTestId("showcase-subline").className).not.toContain(
      "uppercase",
    );
    expect(screen.getByTestId("showcase-grid")).toHaveClass("opacity-70");
    expect(screen.getByTestId("showcase-scrim")).toBeInTheDocument();
    expect(screen.getByTestId("showcase-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("showcase-reticle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("radar-ring")).not.toBeInTheDocument();
    expect(screen.queryByTestId("soundwave-container")).not.toBeInTheDocument();
    expect(screen.queryByTestId("telemetry-node")).not.toBeInTheDocument();
  });

  it("keeps cascade words in lockstep with the headline copy", () => {
    expect(SHOWCASE_CASCADE.map((item) => item.word).join(" ")).toBe(
      LOGIN_PAGE.showcaseHeadline,
    );
    expect(SHOWCASE_CASCADE[0]?.className).toContain("text-[22px]");
  });

  it("sizes cascade type from the panel so words can stay on one line", () => {
    const succeed = SHOWCASE_CASCADE[3];
    expect(succeed.className).toContain("100cqw");
    expect(succeed.className).not.toContain("vw");
    expect(succeed.className).not.toContain("whitespace-nowrap");
  });
});
