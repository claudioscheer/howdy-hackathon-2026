import { beforeEach, describe, expect, it, vi } from "vitest";

const getOpportunityQuestionPrep = vi.hoisted(() => vi.fn());
const generatePlannedQuestions = vi.hoisted(() => vi.fn());
const prismaUpdate = vi.hoisted(() => vi.fn());
const prismaUpdateMany = vi.hoisted(() => vi.fn());
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
      updateMany: prismaUpdateMany,
    },
  }),
}));

import {
  clearGenerationError,
  getGenerationError,
  recordGenerationError,
  startQuestionGeneration,
} from "./question-generation";

const idlePrep = {
  status: "idle",
  targetMinutes: 40,
  sessionAnswerBudget: 10,
  practiceSessionId: null,
  interviewType: "behavioral",
};

function deferredJob(): {
  promise: Promise<void>;
  reject: (err: Error) => void;
} {
  let reject: (err: Error) => void = () => {};
  const promise = new Promise<void>((_, rejectJob) => {
    reject = rejectJob;
  });
  return { promise, reject };
}

async function flushBackground(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));
}

describe("question generation background", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOpenCodeQuestionGenerator.mockReturnValue({ plan: vi.fn() });
    prismaUpdate.mockResolvedValue({});
    prismaUpdateMany.mockResolvedValue({ count: 1 });
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
      ...idlePrep,
      status: "generating",
    });
    await startQuestionGeneration("opp-test");
    expect(prismaUpdate).not.toHaveBeenCalled();
    expect(generatePlannedQuestions).not.toHaveBeenCalled();
  });

  it("surfaces a missing API key without ever marking the row generating", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(idlePrep);
    createOpenCodeQuestionGenerator.mockImplementation(() => {
      throw new Error("OPENCODE_API_KEY is not set.");
    });

    await expect(startQuestionGeneration("opp-test")).rejects.toThrow(
      "OPENCODE_API_KEY is not set.",
    );

    expect(prismaUpdate).not.toHaveBeenCalled();
    expect(prismaUpdateMany).not.toHaveBeenCalled();
    expect(generatePlannedQuestions).not.toHaveBeenCalled();
  });

  it("builds the generator before marking generating, then launches background work", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(idlePrep);
    generatePlannedQuestions.mockReturnValue(deferredJob().promise);

    recordGenerationError("opp-test", new Error("Previous error"));
    await startQuestionGeneration("opp-test");

    expect(getGenerationError("opp-test")).toBeUndefined();
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "opp-test" },
      data: { questionPrepStatus: "generating" },
    });
    const [builtAt] = createOpenCodeQuestionGenerator.mock.invocationCallOrder;
    const [markedAt] = prismaUpdate.mock.invocationCallOrder;
    expect(builtAt).toBeLessThan(markedAt ?? 0);
    expect(generatePlannedQuestions).toHaveBeenCalledWith(
      "opp-test",
      expect.anything(),
    );
    expect(prismaUpdateMany).not.toHaveBeenCalled();
  });

  it("records a background failure and returns the row to idle", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(idlePrep);
    const job = deferredJob();
    generatePlannedQuestions.mockReturnValue(job.promise);

    await startQuestionGeneration("opp-test");
    job.reject(new Error("LLM failure."));
    await flushBackground();

    expect(getGenerationError("opp-test")).toBe("LLM failure.");
    expect(prismaUpdateMany).toHaveBeenCalledWith({
      where: { id: "opp-test", questionPrepStatus: "generating" },
      data: { questionPrepStatus: "idle" },
    });
  });

  it("keeps the recorded error when the idle reset itself fails", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(idlePrep);
    generatePlannedQuestions.mockRejectedValue(new Error("Database down."));
    prismaUpdateMany.mockRejectedValue(new Error("Still down."));

    await startQuestionGeneration("opp-test");
    await flushBackground();

    expect(getGenerationError("opp-test")).toBe("Database down.");
    expect(prismaUpdateMany).toHaveBeenCalledOnce();
  });

  it("uses a custom generator when provided", async () => {
    getOpportunityQuestionPrep.mockResolvedValue(idlePrep);
    generatePlannedQuestions.mockResolvedValue(undefined);
    const customGenerator = { plan: vi.fn() };
    await startQuestionGeneration("opp-test", customGenerator);

    expect(createOpenCodeQuestionGenerator).not.toHaveBeenCalled();
    expect(generatePlannedQuestions).toHaveBeenCalledWith(
      "opp-test",
      customGenerator,
    );
  });
});
