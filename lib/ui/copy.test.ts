import { describe, it, expect } from "vitest";
import {
  CREATE_OPPORTUNITY_PAGE,
  DASHBOARD_PAGE,
  LANDING,
  LOGIN_PAGE,
  QUESTIONS_PAGE,
  practiceButtonLabel,
} from "@/lib/ui/copy";

describe("landing copy", () => {
  it("keeps the practice button label stable", () => {
    expect(practiceButtonLabel()).toBe("Login");
    expect(LANDING.startPractice).toBe("Login");
  });

  it("sells the interview instead of listing product machinery", () => {
    expect(LANDING.product).toBe("Howdy Interview Coach");
    expect(LANDING.title).toBe("Walk me through the last outage you caused.");
    expect(LANDING.description).toBe(
      "Let your engineers hear the hard questions here first.",
    );
    expect(LANDING.description.toLowerCase()).not.toContain("transcript");
    expect(LANDING.description.toLowerCase()).not.toContain("trial");
    expect(LANDING.questions[0]).toBe(LANDING.title);
    expect(LANDING.questions).toHaveLength(8);
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
    expect(DASHBOARD_PAGE.editButton).toBe("Edit");
    expect(DASHBOARD_PAGE.copyLinkButton).toBe("Copy link");
    expect(DASHBOARD_PAGE.generateQuestionsButton).toBe("Generate questions");
    expect(DASHBOARD_PAGE.reviewQuestionsButton).toBe("Review questions");
    expect(QUESTIONS_PAGE.generating).toContain("Preparing");
    expect(QUESTIONS_PAGE.generateDescription).toContain("close to 40 minutes");
    expect(QUESTIONS_PAGE.generateDescription).not.toContain("exactly 4");
    expect(QUESTIONS_PAGE.importanceCore).toContain("Core");
    expect(CREATE_OPPORTUNITY_PAGE.editTitle).toBe("Edit Opportunity");
    expect(DASHBOARD_PAGE.badge).toBe("DEV DAY 2026 // EM PORTAL");
    expect(DASHBOARD_PAGE.disclaimer).toContain("two-attempt product policy");
    expect(DASHBOARD_PAGE.disclaimer).toContain(
      "Opportunity and candidate configuration is stored",
    );
    expect(DASHBOARD_PAGE.emptyState).toContain("No opportunities yet");
    expect(CREATE_OPPORTUNITY_PAGE.title).toBe("Create Opportunity");
    expect(CREATE_OPPORTUNITY_PAGE.submitButton).toBe("Save Opportunity");
    expect(CREATE_OPPORTUNITY_PAGE.roleHint).toContain("Full stack");
    expect(CREATE_OPPORTUNITY_PAGE.techStackHint).toContain("Optional");
    expect(CREATE_OPPORTUNITY_PAGE.jobDescriptionLabel).toBe("Job description");
    expect(CREATE_OPPORTUNITY_PAGE.curriculumLabel).toBe(
      "Candidate curriculum",
    );
  });
});
