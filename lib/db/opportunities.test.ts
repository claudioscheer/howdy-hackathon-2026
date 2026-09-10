import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Candidate, Opportunity } from "@prisma/client";

const findMany = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const connection = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/server", () => ({
  connection,
}));

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    opportunity: {
      findMany,
      create,
    },
  }),
}));

import {
  createOpportunityWithCandidate,
  listDashboardOpportunities,
  toOpportunityItem,
} from "./opportunities";

type OpportunityRow = Opportunity & { candidate: Candidate | null };

function row(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  return {
    id: "opp-2",
    role: "Fullstack Product Engineer",
    seniority: "Senior",
    targetTechStack: ["React", "Node.js"],
    interviewType: "behavioral",
    status: "Active",
    attemptsLimit: 2,
    attemptsUsed: 0,
    token: "fs-3b17c",
    practiceSessionId: "fullstack-product-engineer",
    questionPrepStatus: "idle",
    targetMinutes: 40,
    sessionAnswerBudget: 10,
    jobDescription:
      "Ship product features across React, Node.js, and PostgreSQL.",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    candidate: {
      id: "candidate-alex-rivera",
      displayName: "Alex Rivera",
      curriculum:
        "Alex Rivera. Fullstack engineer. Shipped TypeScript contract tests.",
      opportunityId: "opp-2",
      createdAt: new Date("2026-01-01"),
    },
    ...overrides,
  };
}

describe("dashboard opportunity queries", () => {
  beforeEach(() => {
    findMany.mockReset();
    create.mockReset();
    connection.mockClear();
  });

  it("maps stored rows onto dashboard cards", () => {
    expect(toOpportunityItem(row())).toEqual({
      id: "opp-2",
      role: "Fullstack Product Engineer",
      seniority: "Senior",
      track: "React, Node.js",
      attemptsLimit: 2,
      attemptsUsed: 0,
      status: "Active",
      token: "fs-3b17c",
      practiceSessionId: "fullstack-product-engineer",
      candidateName: "Alex Rivera",
      hasBriefing: true,
      questionCount: 0,
      questionPrepStatus: "idle",
    });
    expect(
      toOpportunityItem(
        row({
          practiceSessionId: null,
          candidate: null,
          questionPrepStatus: "ready",
          _count: { questions: 2 },
        }),
      ),
    ).toEqual({
      id: "opp-2",
      role: "Fullstack Product Engineer",
      seniority: "Senior",
      track: "React, Node.js",
      attemptsLimit: 2,
      attemptsUsed: 0,
      status: "Active",
      token: "fs-3b17c",
      practiceSessionId: undefined,
      candidateName: undefined,
      hasBriefing: false,
      questionCount: 2,
      questionPrepStatus: "ready",
    });
  });

  it("lists opportunities after waiting for the request", async () => {
    findMany.mockResolvedValue([row()]);
    const items = await listDashboardOpportunities();
    expect(connection).toHaveBeenCalledOnce();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: "desc" },
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("opp-2");
  });

  it("creates an active opportunity with a candidate", async () => {
    create.mockResolvedValue(row({ practiceSessionId: null }));

    const created = await createOpportunityWithCandidate({
      candidateDisplayName: "Alex Rivera",
      role: "fullstack",
      seniority: "senior",
      targetTechStack: ["React", "Node.js"],
      interviewType: "behavioral",
      jobDescription: "Ship product features across React and Node.js.",
      curriculum: "Alex Rivera. Fullstack engineer.",
    });

    expect(create).toHaveBeenCalledOnce();
    expect(created.status).toBe("Active");
    expect(created.role).toBe("Fullstack Product Engineer");
    expect(created.candidateName).toBe("Alex Rivera");
  });
});
