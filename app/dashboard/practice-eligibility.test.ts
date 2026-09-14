import { describe, expect, it } from "vitest";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { canOpenPractice, countOpenablePractice } from "./practice-eligibility";

function item(overrides: Partial<OpportunityItem> = {}): OpportunityItem {
  return {
    id: "opp-2",
    role: "fullstack",
    seniority: "senior",
    track: "React",
    attemptsLimit: 2,
    attemptsUsed: 0,
    status: "Active",
    token: "fs-3b17c",
    hasBriefing: true,
    questionCount: 3,
    questionPrepStatus: "ready",
    ...overrides,
  };
}

describe("canOpenPractice", () => {
  it("allows an active opportunity with ready questions and attempts left", () => {
    expect(canOpenPractice(item())).toBe(true);
  });

  it.each([
    ["expired", { status: "Expired" as const }],
    ["draft", { status: "Draft" as const }],
    ["generating", { questionPrepStatus: "generating" as const }],
    ["without questions", { questionCount: 0 }],
    ["out of attempts", { attemptsUsed: 2 }],
  ])("rejects an opportunity that is %s", (_reason, overrides) => {
    expect(canOpenPractice(item(overrides))).toBe(false);
  });
});

describe("countOpenablePractice", () => {
  it("counts only opportunities that can open practice", () => {
    expect(
      countOpenablePractice([
        item(),
        item({ status: "Expired", practiceSessionId: "expired-session" }),
        item({ questionPrepStatus: "idle", practiceSessionId: "idle" }),
      ]),
    ).toBe(1);
    expect(countOpenablePractice([])).toBe(0);
  });
});
