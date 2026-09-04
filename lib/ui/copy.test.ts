import { describe, it, expect } from "vitest";
import {
  DASHBOARD_PAGE,
  LANDING,
  LOGIN_PAGE,
  practiceButtonLabel,
} from "@/lib/ui/copy";

describe("landing copy", () => {
  it("keeps the practice button label stable", () => {
    expect(practiceButtonLabel()).toBe("Login");
    expect(LANDING.startPractice).toBe("Login");
  });

  it("exposes login copy for the split-screen view", () => {
    expect(LOGIN_PAGE.title).toBe("Engineering Manager Login");
    expect(LOGIN_PAGE.submitButton).toBe("Sign In");
    expect(LOGIN_PAGE.passwordPlaceholder).toBe("********");
    expect(LOGIN_PAGE.showcaseHeadline).toBe("Help your engineers succeed.");
  });

  it("exposes dashboard copy for manager workspace", () => {
    expect(DASHBOARD_PAGE.createButton).toBe("Create Opportunity");
    expect(DASHBOARD_PAGE.generateLinkButton).toBe("Generate Link");
    expect(DASHBOARD_PAGE.badge).toBe("DEV DAY 2026 // EM PORTAL");
    expect(DASHBOARD_PAGE.disclaimer).toContain(
      "Practice links expire after two attempts or after one week.",
    );
  });
});
