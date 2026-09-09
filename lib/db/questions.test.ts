import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const deleteMany = vi.hoisted(() => vi.fn());
const createMany = vi.hoisted(() => vi.fn());
const defaultPlan = vi.hoisted(() => vi.fn());

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: { findUnique, update },
    plannedQuestion: { findMany, deleteMany, createMany },
  }),
}));

vi.mock("@/lib/interview/planner", () => ({
  createOpenCodeQuestionGenerator: () => ({ plan: defaultPlan }),
}));

import {
  generatePlannedQuestions,
  getQuestionPrepStatus,
  listPlannedQuestions,
  loadQuestionBriefing,
  savePlannedQuestions,
} from "./questions";

const opportunityRow = {
  id: "opp-2",
  role: "fullstack",
  seniority: "senior",
  targetTechStack: ["TypeScript"],
  interviewType: "behavioral",
  jobDescription: "Build the coach.",
  candidate: { displayName: "Alex", curriculum: "React work." },
};

describe("planned questions", () => {
  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    update.mockReset();
    deleteMany.mockReset();
    createMany.mockReset();
    defaultPlan.mockReset();
    update.mockResolvedValue({});
    deleteMany.mockResolvedValue({});
    createMany.mockResolvedValue({});
  });

  it("lists planned questions in sort order", async () => {
    findMany.mockResolvedValue([{ id: "q1", prompt: "Why?" }]);
    await expect(listPlannedQuestions("opp-2")).resolves.toEqual([
      { id: "q1", prompt: "Why?" },
    ]);
  });

  it("returns the prep status or null when missing", async () => {
    findUnique.mockResolvedValue({ questionPrepStatus: "ready" });
    await expect(getQuestionPrepStatus("opp-2")).resolves.toBe("ready");
    findUnique.mockResolvedValue(null);
    await expect(getQuestionPrepStatus("missing")).resolves.toBeNull();
  });

  it("loads a briefing from the opportunity and candidate", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    await expect(loadQuestionBriefing("opp-2")).resolves.toEqual({
      opportunity: {
        id: "opp-2",
        role: "fullstack",
        seniority: "senior",
        targetTechStack: ["TypeScript"],
        interviewType: "behavioral",
      },
      attemptNumber: 1,
      usedQuestions: [],
      jobDescription: "Build the coach.",
      curriculum: "React work.",
    });
  });

  it("rejects a missing or incomplete opportunity", async () => {
    findUnique.mockResolvedValue(null);
    await expect(loadQuestionBriefing("missing")).rejects.toThrow(
      "Opportunity not found.",
    );
    findUnique.mockResolvedValue({
      ...opportunityRow,
      targetTechStack: [],
      candidate: null,
    });
    await expect(loadQuestionBriefing("opp-2")).rejects.toThrow(
      "Opportunity is missing planner fields.",
    );
  });

  it("uses an empty curriculum when the candidate is absent", async () => {
    findUnique.mockResolvedValue({ ...opportunityRow, candidate: null });
    await expect(loadQuestionBriefing("opp-2")).resolves.toMatchObject({
      curriculum: "",
    });
  });

  it("writes planner prompts and uses the default generator", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    defaultPlan.mockResolvedValue({
      questions: [
        {
          id: "q-1",
          prompt: "  First?  ",
          primaryDimension: "specificity",
        },
      ],
    });
    await generatePlannedQuestions("opp-2");
    expect(defaultPlan).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      where: { id: "opp-2" },
      data: { questionPrepStatus: "ready" },
    });
  });

  it("resets prep status when planning fails", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    const plan = vi.fn(async () => {
      throw new Error("upstream");
    });
    await expect(generatePlannedQuestions("opp-2", { plan })).rejects.toThrow(
      "upstream",
    );
    expect(update).toHaveBeenLastCalledWith({
      where: { id: "opp-2" },
      data: { questionPrepStatus: "idle" },
    });

    plan.mockResolvedValue({ questions: [] });
    await expect(generatePlannedQuestions("opp-2", { plan })).rejects.toThrow(
      "The question planner returned an invalid plan.",
    );
  });

  it("saves trimmed prompts and marks idle when none remain", async () => {
    await savePlannedQuestions("opp-2", ["  Keep me  ", "   "]);
    expect(createMany).toHaveBeenCalledOnce();
    await savePlannedQuestions("opp-2", ["  ", ""]);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenLastCalledWith({
      where: { id: "opp-2" },
      data: { questionPrepStatus: "idle" },
    });
  });
});
