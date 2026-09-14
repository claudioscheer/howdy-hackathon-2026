import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const deleteMany = vi.hoisted(() => vi.fn());
const createMany = vi.hoisted(() => vi.fn());
const defaultPlan = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() => vi.fn());

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: { findUnique, update },
    plannedQuestion: { findMany, deleteMany, createMany },
    $transaction: transaction,
  }),
}));

vi.mock("@/lib/interview/planner", () => ({
  createOpenCodeQuestionGenerator: () => ({ plan: defaultPlan }),
}));

import { OpportunityProfileSchema } from "@/lib/interview/contracts";
import { STALE_GENERATION_MS } from "./question-prep-status";
import {
  generatePlannedQuestions,
  getOpportunityQuestionPrep,
  getQuestionPrepStatus,
  listPlannedQuestions,
  loadQuestionBriefing,
  savePlannedQuestions,
} from "./questions";

/** A Prisma-style lazy write: it only runs when something awaits it. */
function lazyWrite(name: string): {
  name: string;
  then: ReturnType<typeof vi.fn>;
} {
  return {
    name,
    then: vi.fn((resolve: (value: string) => void) => resolve(name)),
  };
}

function sampleBrief(
  competency: string,
  importance: "core" | "supporting",
  timeBudgetMinutes: number,
  maxFollowUps: 1 | 2,
  answerBudget: number,
) {
  return {
    competency,
    roleRelevance: "Needed for the role.",
    importance,
    expectedDepth: "A concrete owned example.",
    evidenceToListenFor: ["owned action"],
    followUpTriggers: ["missing ownership"],
    timeBudgetMinutes,
    answerBudget,
    maxFollowUps,
    stopWhen: ["enough evidence is present"],
  };
}

const opportunityRow = {
  id: "opp-2",
  role: "fullstack",
  seniority: "senior",
  targetTechStack: ["TypeScript"],
  interviewType: "behavioral" as const,
  jobDescription: "Build the coach.",
  questionPrepStatus: "idle" as const,
  targetMinutes: 40,
  sessionAnswerBudget: 10,
  practiceSessionId: "opp-2",
  updatedAt: new Date("2026-01-01"),
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
    transaction.mockReset();
    update.mockResolvedValue({});
    deleteMany.mockResolvedValue({});
    createMany.mockResolvedValue({});
    transaction.mockImplementation(async (writes: unknown[]) =>
      Promise.all(writes),
    );
  });

  it("reports a recent generating status and retires an abandoned one", async () => {
    findUnique.mockResolvedValue({
      ...opportunityRow,
      questionPrepStatus: "generating",
      updatedAt: new Date(),
    });
    await expect(getOpportunityQuestionPrep("opp-2")).resolves.toMatchObject({
      status: "generating",
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ updatedAt: true }),
      }),
    );

    findUnique.mockResolvedValue({
      ...opportunityRow,
      questionPrepStatus: "generating",
      updatedAt: new Date(Date.now() - STALE_GENERATION_MS - 60_000),
    });
    await expect(getOpportunityQuestionPrep("opp-2")).resolves.toMatchObject({
      status: "idle",
    });
  });

  it("replaces a saved plan atomically in one transaction", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    const removal = lazyWrite("delete");
    const insert = lazyWrite("create");
    const status = lazyWrite("status");
    deleteMany.mockReturnValue(removal);
    createMany.mockReturnValue(insert);
    update.mockReturnValue(status);
    transaction.mockResolvedValue([]);

    await savePlannedQuestions("opp-2", [
      { prompt: "Keep me", primaryDimension: "specificity" },
    ]);

    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith([removal, insert, status]);
    expect(removal.then).not.toHaveBeenCalled();
    expect(insert.then).not.toHaveBeenCalled();
    expect(status.then).not.toHaveBeenCalled();

    transaction.mockClear();
    await savePlannedQuestions("opp-2", []);
    expect(transaction).toHaveBeenCalledWith([removal, status]);
  });

  it("keeps the previous plan when the replacement transaction fails", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    const removal = lazyWrite("delete");
    const status = lazyWrite("status");
    deleteMany.mockReturnValue(removal);
    createMany.mockReturnValue(lazyWrite("create"));
    update.mockReturnValue(status);
    transaction.mockRejectedValue(new Error("createMany failed"));

    await expect(
      savePlannedQuestions("opp-2", [
        { prompt: "Keep me", primaryDimension: "specificity" },
      ]),
    ).rejects.toThrow("createMany failed");

    expect(removal.then).not.toHaveBeenCalled();
    expect(status.then).not.toHaveBeenCalled();
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

  it("briefs an opportunity saved without a tech stack", async () => {
    findUnique.mockResolvedValue({ ...opportunityRow, targetTechStack: [] });
    const briefing = await loadQuestionBriefing("opp-2");
    expect(briefing.opportunity.targetTechStack).toEqual(["General"]);
    expect(
      OpportunityProfileSchema.safeParse(briefing.opportunity).success,
    ).toBe(true);
  });

  it("generates questions for an opportunity without a tech stack", async () => {
    findUnique.mockResolvedValue({ ...opportunityRow, targetTechStack: [] });
    const plan = vi.fn(async () => ({ questions: [] }));
    await expect(generatePlannedQuestions("opp-2", { plan })).rejects.toThrow(
      "The question planner returned an invalid plan.",
    );
    expect(plan).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunity: expect.objectContaining({ targetTechStack: ["General"] }),
      }),
    );
  });

  it("rejects a missing or incomplete opportunity", async () => {
    findUnique.mockResolvedValue(null);
    await expect(loadQuestionBriefing("missing")).rejects.toThrow(
      "Opportunity not found.",
    );
    // An empty tech stack now falls back to "General"; an empty role is still
    // a genuinely incomplete opportunity the planner must refuse.
    findUnique.mockResolvedValue({
      ...opportunityRow,
      role: "",
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
          brief: sampleBrief("Ownership", "core", 8, 2, 3),
        },
        {
          id: "q-2",
          prompt: "Second?",
          primaryDimension: "fundamentals",
          brief: sampleBrief("API design", "core", 9, 2, 3),
        },
        {
          id: "q-3",
          prompt: "Third?",
          primaryDimension: "fundamentals",
          brief: sampleBrief("Data modeling", "core", 8, 2, 3),
        },
        {
          id: "q-4",
          prompt: "Fourth?",
          primaryDimension: "structure",
          brief: sampleBrief("Collaboration", "supporting", 5, 1, 2),
        },
      ],
    });
    await generatePlannedQuestions("opp-2");
    expect(defaultPlan).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      where: { id: "opp-2" },
      data: {
        questionPrepStatus: "ready",
        targetMinutes: 40,
        sessionAnswerBudget: 10,
      },
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

    plan.mockResolvedValue({
      questions: [
        {
          id: "q-1",
          prompt: "Only one prompt?",
          primaryDimension: "specificity",
        },
      ],
    });
    await expect(generatePlannedQuestions("opp-2", { plan })).rejects.toThrow(
      "The question planner returned an invalid plan.",
    );
  });

  it("saves trimmed prompts and marks idle when none remain", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    await savePlannedQuestions("opp-2", [
      {
        prompt: "  Keep me  ",
        primaryDimension: "specificity",
      },
      {
        prompt: "   ",
        primaryDimension: "specificity",
      },
    ]);
    expect(createMany).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      where: { id: "opp-2" },
      data: {
        questionPrepStatus: "ready",
        targetMinutes: 40,
        sessionAnswerBudget: 10,
      },
    });
    await savePlannedQuestions("opp-2", [
      { prompt: "  ", primaryDimension: "specificity" },
      { prompt: "", primaryDimension: "specificity" },
    ]);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenLastCalledWith({
      where: { id: "opp-2" },
      data: {
        questionPrepStatus: "idle",
        targetMinutes: 40,
        sessionAnswerBudget: 10,
      },
    });
  });

  it("rejects a duplicate prompt-only plan and a missing opportunity", async () => {
    findUnique.mockResolvedValue(opportunityRow);
    await expect(
      savePlannedQuestions("opp-2", [
        { prompt: "Same?", primaryDimension: "specificity" },
        { prompt: "Same?", primaryDimension: "specificity" },
      ]),
    ).rejects.toThrow("The plan repeats a question prompt.");
    findUnique.mockResolvedValue(null);
    await expect(
      savePlannedQuestions("missing", [
        { prompt: "Keep me", primaryDimension: "specificity" },
      ]),
    ).rejects.toThrow("Opportunity not found.");
  });
});
