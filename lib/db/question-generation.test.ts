import { beforeEach, describe, expect, it, vi } from "vitest";

const getOpportunityQuestionPrep = vi.hoisted(() => vi.fn());
const generatePlannedQuestions = vi.hoisted(() => vi.fn());
const prismaUpdate = vi.hoisted(() => vi.fn());
const createOpenCodeQuestionGenerator = vi.hoisted(() => vi.fn());

vi.mock("@/lib/interview/planner", () => ({
  createOpenCodeQuestionGenerator,
}));

vi.mock("./questions", () => ({
  getOpportunityQuestionPrep,
  generatePlannedQuestions,
}));

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: {
      update: prismaUpdate,
    },
  }),
}));

import {
  clearGenerationError,
  getGenerationError,
  recordGenerationError,
  startQuestionGeneration,
} from "./question-generation";

describe("question generation background", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOpenCodeQuestionGenerator.mockReturnValue({ plan: vi.fn() });
    clearGenerationError("opp-test");
  });

  it("stores and clears generation errors", () => {
    expect(getGenerationError("opp-test")).toBeUndefined();
    recordGenerationError("opp-test", new Error("Plan failed."));
    expect(getGenerationError("opp-test")).toBe("Plan failed.");

    recordGenerationError("opp-test", "raw failure");
    expect(getGenerationError("opp-test")).toBe("Question generation failed.");

    clearGenerationError("opp-test");
    expect(getGenerationError("opp-test")).toBeUndefined();
  });

  it("throws when the opportunity does not exist", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(null);
    await expect(startQuestionGeneration("opp-missing")).rejects.toThrow(
      "Opportunity not found.",
    );
    expect(prismaUpdate).not.toHaveBeenCalled();
    expect(generatePlannedQuestions).not.toHaveBeenCalled();
  });

  it("does not restart generation if already generating", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      status: "generating",
      targetMinutes: 40,
      sessionAnswerBudget: 10,
      practiceSessionId: null,
      interviewType: "behavioral",
    });
    await startQuestionGeneration("opp-test");
    expect(prismaUpdate).not.toHaveBeenCalled();
    expect(generatePlannedQuestions).not.toHaveBeenCalled();
  });

  it("marks generating, launches background work, and records failure", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      status: "idle",
      targetMinutes: 40,
      sessionAnswerBudget: 10,
      practiceSessionId: null,
      interviewType: "behavioral",
    });
    prismaUpdate.mockResolvedValue({});
    let rejectJob: (err: Error) => void = () => {};
    const deferred = new Promise<void>((_, reject) => {
      rejectJob = reject;
    });
    generatePlannedQuestions.mockReturnValue(deferred);

    recordGenerationError("opp-test", new Error("Previous error"));
    await startQuestionGeneration("opp-test");

    expect(getGenerationError("opp-test")).toBeUndefined();
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "opp-test" },
      data: { questionPrepStatus: "generating" },
    });
    expect(generatePlannedQuestions).toHaveBeenCalledWith(
      "opp-test",
      expect.anything(),
    );

    rejectJob(new Error("LLM failure."));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getGenerationError("opp-test")).toBe("LLM failure.");
  });

  it("uses a custom generator when provided", async () => {
    getOpportunityQuestionPrep.mockResolvedValue({
      status: "idle",
      targetMinutes: 40,
      sessionAnswerBudget: 10,
      practiceSessionId: null,
      interviewType: "behavioral",
    });
    prismaUpdate.mockResolvedValue({});
    generatePlannedQuestions.mockResolvedValue(undefined);
    const customGenerator = { plan: vi.fn() };
    await startQuestionGeneration("opp-test", customGenerator);

    expect(generatePlannedQuestions).toHaveBeenCalledWith(
      "opp-test",
      customGenerator,
    );
  });
});
