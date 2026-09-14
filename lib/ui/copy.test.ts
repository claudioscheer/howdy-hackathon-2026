import { describe, it, expect } from "vitest";
import {
  CREATE_OPPORTUNITY_PAGE,
  DASHBOARD_PAGE,
  LANDING,
  LOGIN_PAGE,
  PRACTICE_PAGE,
  QUESTIONS_PAGE,
  formatElapsed,
  practiceButtonLabel,
  practiceFormatBody,
  practiceGreeting,
  practiceProgress,
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

  it("does not claim unenforced trial limits or link policies", () => {
    expect(LOGIN_PAGE.description).toBe(
      "Sign in to configure interview templates, generate questions, and share candidate practice links.",
    );
    expect(LOGIN_PAGE.description.toLowerCase()).not.toContain("trial");
    expect(LOGIN_PAGE.description.toLowerCase()).not.toContain("disposable");
    expect(PRACTICE_PAGE.formatBody).toBe(
      "Typed answers, about {minutes} minutes. Follow-ups exist so you can add concrete evidence — situation, action, and result — when an answer is vague.",
    );
    expect(practiceFormatBody(40).toLowerCase()).not.toContain("attempt");
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

  it("exposes practice briefing, greeting, and timer copy", () => {
    expect(PRACTICE_PAGE.startButton).toBe("Start practice interview");
    expect(practiceFormatBody(40)).toContain("40 minutes");
    expect(practiceGreeting("Fullstack Product Engineer")).toContain(
      "Fullstack Product Engineer",
    );
    expect(practiceProgress(0, 3, false)).toBe("Question 1 of 3");
    expect(practiceProgress(2, 3, true)).toBe("Interview complete");
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(75)).toBe("01:15");
    expect(formatElapsed(-3)).toBe("00:00");
    expect(PRACTICE_PAGE.endConfirmBody).toContain("insufficient evidence");
    expect(PRACTICE_PAGE.dictationHint).toContain("OS dictation");
  });
});
