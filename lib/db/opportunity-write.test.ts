import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: { findUnique, update },
  }),
}));

import {
  getOpportunityForEdit,
  parsedInterviewType,
  toCreateInput,
  updateOpportunityWithCandidate,
} from "./opportunity-write";

const record = {
  id: "opp-2",
  role: "fullstack",
  seniority: "senior",
  targetTechStack: ["React"],
  interviewType: "behavioral" as const,
  jobDescription: "Ship product work.",
  status: "Active" as const,
  questionPrepStatus: "idle" as const,
  targetMinutes: 40,
  sessionAnswerBudget: 10,
  attemptsLimit: 2,
  attemptsUsed: 0,
  token: "fs-3b17c",
  practiceSessionId: "fullstack-product-engineer",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  candidate: {
    id: "candidate-1",
    displayName: "Alex Rivera",
    curriculum: "Resume text",
    opportunityId: "opp-2",
    createdAt: new Date("2026-01-01"),
  },
};

describe("opportunity write helpers", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it("loads a record for editing", async () => {
    findUnique.mockResolvedValue(record);
    await expect(getOpportunityForEdit("opp-2")).resolves.toEqual(record);
  });

  it("defaults unknown interview types to behavioral", () => {
    expect(parsedInterviewType("behavioral")).toBe("behavioral");
    expect(parsedInterviewType("mystery")).toBe("behavioral");
  });

  it("maps stored values onto the create form input", () => {
    expect(toCreateInput(record).candidateDisplayName).toBe("Alex Rivera");
    expect(toCreateInput(record).role).toBe("fullstack");
  });

  it("falls back when stored role values are unknown", () => {
    const mapped = toCreateInput({
      ...record,
      role: "Staff Engineer",
      seniority: "Principal",
      interviewType: "behavioral",
      candidate: null,
    });
    expect(mapped.role).toBe("fullstack");
    expect(mapped.seniority).toBe("senior");
    expect(mapped.interviewType).toBe("behavioral");
    expect(mapped.candidateDisplayName).toBe("");
    expect(mapped.curriculum).toBe("");
  });

  it("updates the opportunity and candidate", async () => {
    update.mockResolvedValue(record);
    await updateOpportunityWithCandidate("opp-2", {
      candidateDisplayName: "Alex Rivera",
      role: "fullstack",
      seniority: "senior",
      targetTechStack: ["React"],
      interviewType: "behavioral",
      jobDescription: "Ship product work.",
      curriculum: "Resume text",
    });
    expect(update).toHaveBeenCalledOnce();
  });
});
