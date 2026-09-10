import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());
const connection = vi.hoisted(() => vi.fn(async () => undefined));
const loadLatestAttempt = vi.hoisted(() => vi.fn(async () => null));
const reportFromStored = vi.hoisted(() => vi.fn(() => null));

vi.mock("next/server", () => ({
  connection,
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    opportunity: { findFirst },
  }),
}));

vi.mock("@/lib/db/practice-attempts", () => ({
  loadLatestAttempt,
  reportFromStored,
}));

import { SEEDED_SESSION_ID, SEEDED_QUESTION_PLAN } from "./seed";
import {
  interviewQuestionsFromRows,
  loadPracticePageData,
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
    loadLatestAttempt.mockReset();
    loadLatestAttempt.mockResolvedValue(null);
    reportFromStored.mockReset();
    reportFromStored.mockReturnValue(null);
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
    expect(session?.attemptNumber).toBe(1);
    expect(session?.evaluationPath).toBe("basic");
    expect(
      sessionFromOpportunity(
        { ...opportunity, attemptsUsed: 1 },
        SEEDED_SESSION_ID,
      )?.attemptNumber,
    ).toBe(2);
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

  it("reopens a stored scorecard when both attempts are used", async () => {
    findFirst.mockResolvedValue({ ...opportunity, attemptsUsed: 2 });
    loadLatestAttempt.mockResolvedValue({
      attemptNumber: 2,
      summary: "Second attempt.",
      dimensions: {},
    });
    const report = {
      attemptNumber: 2,
      summary: "Second attempt.",
      dimensions: {
        relevance: {
          status: "scored" as const,
          score: 4,
          summary: "On topic.",
          evidence: [],
        },
        specificity: {
          status: "scored" as const,
          score: 3,
          summary: "Some.",
          evidence: [],
        },
        fundamentals: {
          status: "scored" as const,
          score: 3,
          summary: "Some.",
          evidence: [],
        },
        structure: {
          status: "scored" as const,
          score: 3,
          summary: "Some.",
          evidence: [],
        },
      },
    };
    reportFromStored.mockReturnValue(report);
    const loaded = await loadPracticePageData(SEEDED_SESSION_ID);
    expect(loaded?.session.status).toBe("COMPLETE");
    expect(loaded?.session.report?.attemptNumber).toBe(2);
    reportFromStored.mockReturnValue(null);
    expect(
      (await loadPracticePageData(SEEDED_SESSION_ID))?.session.status,
    ).toBe("PLANNED");
    loadLatestAttempt.mockResolvedValue(null);
    expect(
      (await loadPracticePageData(SEEDED_SESSION_ID))?.session.status,
    ).toBe("PLANNED");
  });

  it("loads target minutes with the planned session", async () => {
    findFirst.mockResolvedValue(opportunity);
    const loaded = await loadPracticePageData(SEEDED_SESSION_ID);
    expect(loaded?.targetMinutes).toBe(40);
    findFirst.mockResolvedValue(null);
    const seeded = await loadPracticePageData(SEEDED_SESSION_ID);
    expect(seeded?.targetMinutes).toBe(40);
    expect(await loadPracticePageData("unknown")).toBeNull();
  });
});
