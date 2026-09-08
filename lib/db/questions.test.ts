import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const deleteMany = vi.hoisted(() => vi.fn());
const createMany = vi.hoisted(() => vi.fn());
const waitForQuestionPrep = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: { findUnique, update },
    plannedQuestion: { findMany, deleteMany, createMany },
  }),
}));

vi.mock("./question-prep-wait", () => ({
  waitForQuestionPrep,
  QUESTION_PREP_DELAY_MS: 1500,
}));

import {
  generatePlaceholderQuestions,
  getQuestionPrepStatus,
  listPlannedQuestions,
  savePlannedQuestions,
} from "./questions";

describe("planned questions", () => {
  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    update.mockReset();
    deleteMany.mockReset();
    createMany.mockReset();
    waitForQuestionPrep.mockReset();
    waitForQuestionPrep.mockResolvedValue(undefined);
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

  it("writes placeholder questions after the prep wait", async () => {
    update.mockResolvedValue({});
    deleteMany.mockResolvedValue({});
    createMany.mockResolvedValue({});
    await generatePlaceholderQuestions("opp-2");
    expect(waitForQuestionPrep).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledOnce();
  });

  it("saves trimmed prompts and marks idle when none remain", async () => {
    deleteMany.mockResolvedValue({});
    createMany.mockResolvedValue({});
    update.mockResolvedValue({});
    await savePlannedQuestions("opp-2", ["  Keep me  ", "   "]);
    expect(createMany).toHaveBeenCalledOnce();
    await savePlannedQuestions("opp-2", ["  ", ""]);
    expect(createMany).toHaveBeenCalledTimes(1);
  });
});
