import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoginPage from "./page";
import { LOGIN_PAGE } from "@/lib/ui/copy";

describe("LoginPage", () => {
  it("renders back link, title, description, form, and showcase", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("back-home-link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("login-title")).toHaveTextContent(
      LOGIN_PAGE.title,
    );
    expect(screen.getByTestId("login-description")).toHaveTextContent(
      LOGIN_PAGE.description,
    );
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("login-showcase")).toBeInTheDocument();
  });
});
