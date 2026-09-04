import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form";
import { LOGIN_PAGE } from "./copy";

describe("LoginForm", () => {
  it("renders email, password, and sign-in button", () => {
    render(<LoginForm />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toHaveValue("");
    expect(screen.getByTestId("email-input")).toHaveAttribute("type", "email");
    expect(screen.getByTestId("password-input")).toHaveValue("");
    expect(screen.getByTestId("password-input")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByTestId("login-submit")).toHaveTextContent(
      LOGIN_PAGE.submitButton,
    );
  });

  it("handles input changes and redirects directly to /dashboard on submit", () => {
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });

    render(<LoginForm />);
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");

    fireEvent.change(emailInput, { target: { value: "em@howdy.com" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    expect(emailInput).toHaveValue("em@howdy.com");
    expect(passwordInput).toHaveValue("secret123");

    fireEvent.submit(screen.getByTestId("login-form"));
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
