import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());
const connection = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/server", () => ({
  connection,
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    opportunity: { findFirst },
  }),
}));

import { SEEDED_SESSION_ID, SEEDED_QUESTION_PLAN } from "./seed";
import {
  interviewQuestionsFromRows,
  loadPracticeSession,
  sessionFromOpportunity,
} from "./practice-session";

const opportunity = {
  id: "opp-2",
  role: "fullstack",
  seniority: "senior",
  targetTechStack: ["React"],
  interviewType: "behavioral" as const,
  jobDescription: "Ship product work.",
  status: "Active" as const,
  questionPrepStatus: "ready" as const,
  targetMinutes: 40,
  sessionAnswerBudget: 8,
  attemptsLimit: 2,
  attemptsUsed: 0,
  token: "fs-3b17c",
  practiceSessionId: SEEDED_SESSION_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  candidate: {
    id: "candidate-1",
    displayName: "Alex Rivera",
    curriculum: "Resume",
    opportunityId: "opp-2",
    createdAt: new Date("2026-01-01"),
  },
  questions: [
    {
      id: "saved-q1",
      opportunityId: "opp-2",
      prompt: "Name the maple syrup caching tradeoff you reversed.",
      sortOrder: 0,
      primaryDimension: "specificity",
      importance: null,
      competency: null,
      brief: null,
      createdAt: new Date("2026-01-01"),
    },
  ],
};

describe("practice session loading", () => {
  beforeEach(() => {
    findFirst.mockReset();
    connection.mockClear();
  });

  it("maps stored questions onto the interview plan", () => {
    expect(interviewQuestionsFromRows(opportunity.questions)[0]).toMatchObject({
      id: "saved-q1",
      prompt: "Name the maple syrup caching tradeoff you reversed.",
    });
    expect(
      interviewQuestionsFromRows([
        { ...opportunity.questions[0], primaryDimension: "nope" },
      ])[0]?.primaryDimension,
    ).toBe("specificity");
  });

  it("uses saved questions and the persisted answer budget", () => {
    const session = sessionFromOpportunity(opportunity, SEEDED_SESSION_ID);
    expect(session?.questions[0]?.prompt).toContain("maple syrup");
    expect(session?.sessionAnswerBudget).toBe(8);
    expect(session?.evaluationPath).toBe("basic");
    const briefed = sessionFromOpportunity(
      {
        ...opportunity,
        questions: [
          {
            ...opportunity.questions[0],
            brief: {
              competency: "Caching",
              roleRelevance: "The role owns latency.",
              importance: "core",
              expectedDepth: "A caching tradeoff.",
              evidenceToListenFor: ["tradeoff"],
              followUpTriggers: ["no tradeoff"],
              timeBudgetMinutes: 8,
              answerBudget: 3,
              maxFollowUps: 2,
              stopWhen: ["a tradeoff is described"],
            },
          },
        ],
      },
      SEEDED_SESSION_ID,
    );
    expect(briefed?.evaluationPath).toBe("briefed");
  });

  it("returns null when the opportunity has no candidate or questions", () => {
    expect(
      sessionFromOpportunity(
        { ...opportunity, candidate: null },
        SEEDED_SESSION_ID,
      ),
    ).toBeNull();
    expect(
      sessionFromOpportunity({ ...opportunity, questions: [] }, "opp-2"),
    ).toBeNull();
    expect(
      sessionFromOpportunity(
        { ...opportunity, targetTechStack: [] },
        SEEDED_SESSION_ID,
      )?.opportunity.targetTechStack,
    ).toEqual(["General"]);
    expect(
      sessionFromOpportunity({ ...opportunity, role: "" }, SEEDED_SESSION_ID),
    ).toBeNull();
  });

  it("loads a saved plan from the opportunity, then falls back to the seed", async () => {
    findFirst.mockResolvedValue(opportunity);
    const loaded = await loadPracticeSession(SEEDED_SESSION_ID);
    expect(loaded?.questions[0]?.prompt).toContain("maple syrup");

    findFirst.mockResolvedValue({ ...opportunity, questions: [] });
    const emptySaved = await loadPracticeSession(SEEDED_SESSION_ID);
    expect(emptySaved?.questions[0]?.prompt).toBe(
      SEEDED_QUESTION_PLAN[0]?.prompt,
    );

    findFirst.mockResolvedValue(null);
    const seeded = await loadPracticeSession(SEEDED_SESSION_ID);
    expect(seeded?.questions[0]?.prompt).toBe(SEEDED_QUESTION_PLAN[0]?.prompt);

    const missing = await loadPracticeSession("unknown");
    expect(missing).toBeNull();
  });
});
