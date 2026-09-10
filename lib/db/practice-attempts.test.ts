import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionReducer } from "@/lib/interview/reducer";
import { ScriptedReportEvaluator } from "@/lib/interview/report-evaluator";
import { createSeededSession } from "@/lib/interview/seed";
import { endInterview } from "@/lib/interview/session-report";

const findUnique = vi.hoisted(() => vi.fn());
const findFirst = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() => vi.fn());

vi.mock("./prisma", () => ({
  getPrisma: () => ({
    interviewAttempt: { findUnique, findFirst, create },
    opportunity: { update },
    $transaction: transaction,
  }),
}));

import {
  loadLatestAttempt,
  reportFromStored,
  savePracticeAttempt,
} from "./practice-attempts";

describe("practice attempts", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findFirst.mockReset();
    create.mockReset();
    update.mockReset();
    transaction.mockReset();
  });

  it("persists a completed scorecard without transcript quotes", async () => {
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const ended = await endInterview(started, new ScriptedReportEvaluator());
    if (!ended.ok) {
      throw new Error("Expected the interview to end.");
    }
    findUnique.mockResolvedValue(null);
    transaction.mockResolvedValue([{}, {}]);
    await savePracticeAttempt(ended.state, 95);
    expect(transaction).toHaveBeenCalledOnce();
    const writes = transaction.mock.calls[0]?.[0];
    expect(writes).toHaveLength(2);

    const report = ended.state.report;
    if (report === undefined) {
      throw new Error("Expected a report.");
    }
    findUnique.mockResolvedValue(null);
    await savePracticeAttempt(
      {
        ...ended.state,
        report: {
          ...report,
          dimensions: {
            ...report.dimensions,
            relevance: {
              status: "scored",
              score: 4,
              summary: "On topic.",
              evidence: [],
              remainingUnknown: "Later cores were not asked.",
            },
          },
        },
      },
      12,
    );
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("skips incomplete sessions and existing attempts", async () => {
    await savePracticeAttempt(createSeededSession(), 10);
    expect(findUnique).not.toHaveBeenCalled();
    const started = sessionReducer(createSeededSession(), {
      type: "START_SESSION",
    });
    const ended = await endInterview(started, new ScriptedReportEvaluator());
    if (!ended.ok) {
      throw new Error("Expected the interview to end.");
    }
    findUnique.mockResolvedValue({ id: "existing" });
    await savePracticeAttempt(ended.state, 10);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("restores a stored scorecard without quotes", async () => {
    findFirst.mockResolvedValue({
      attemptNumber: 1,
      summary: "Improve structure.",
      dimensions: {
        relevance: { status: "scored", score: 4, summary: "On topic." },
        specificity: {
          status: "insufficient_evidence",
          summary: "Unknown.",
          remainingUnknown: "Ended early.",
        },
        fundamentals: { status: "scored", score: 3, summary: "Some." },
        structure: { status: "scored", score: 2, summary: "Unclear." },
      },
    });
    const loaded = await loadLatestAttempt("opp-2");
    expect(loaded?.attemptNumber).toBe(1);
    const report = reportFromStored({
      attemptNumber: 1,
      summary: "Improve structure.",
      dimensions: loaded?.dimensions,
    });
    expect(report?.dimensions.relevance).toMatchObject({
      status: "scored",
      evidence: [],
    });
    expect(
      reportFromStored({ attemptNumber: 1, summary: "x", dimensions: {} }),
    ).toBeNull();
    expect(
      reportFromStored({
        attemptNumber: 1,
        summary: "x",
        dimensions: {
          relevance: { status: "insufficient_evidence", summary: "Unknown." },
          specificity: { status: "insufficient_evidence", summary: "Unknown." },
          fundamentals: {
            status: "insufficient_evidence",
            summary: "Unknown.",
          },
          structure: { status: "insufficient_evidence", summary: "Unknown." },
        },
      }),
    ).toBeNull();
    findFirst.mockResolvedValue(null);
    expect(await loadLatestAttempt("opp-2")).toBeNull();
  });
});
