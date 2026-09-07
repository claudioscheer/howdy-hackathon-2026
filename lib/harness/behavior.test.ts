import { describe, expect, it } from "vitest";
import { inspectBehavior, sensitivityFailures } from "./behavior";
import { type CaseTrace } from "./report";

const evidenceCase: CaseTrace = {
  id: "evidence",
  suite: "golden",
  description: "All behavior markers.",
  evaluator: "SCRIPTED",
  pass: true,
  steps: [
    {
      outcome: "APPLIED",
      recommendedDecision: "FOLLOW_UP",
      dimension: "specificity",
      questionIndex: 0,
      followUpCount: 1,
      historyLength: 3,
      status: "AWAITING_ANSWER",
      stateUnchanged: false,
    },
    {
      outcome: "APPLIED",
      recommendedDecision: "FOLLOW_UP",
      dimension: "specificity",
      questionIndex: 0,
      followUpCount: 2,
      historyLength: 5,
      status: "AWAITING_ANSWER",
      stateUnchanged: false,
    },
    {
      outcome: "APPLIED",
      recommendedDecision: "FOLLOW_UP",
      dimension: "specificity",
      questionIndex: 1,
      followUpCount: 0,
      historyLength: 7,
      status: "AWAITING_ANSWER",
      stateUnchanged: false,
    },
    {
      outcome: "APPLIED",
      recommendedDecision: "MOVE_ON",
      questionIndex: 1,
      followUpCount: 0,
      historyLength: 5,
      status: "AWAITING_ANSWER",
      stateUnchanged: false,
    },
    {
      outcome: "REJECTED",
      questionIndex: 0,
      followUpCount: 0,
      historyLength: 1,
      status: "AWAITING_ANSWER",
      stateUnchanged: true,
    },
  ],
};

describe("behavior evidence", () => {
  it("finds all required evidence only in passing cases", () => {
    expect(Object.values(inspectBehavior([evidenceCase])).every(Boolean)).toBe(
      true,
    );
    expect(inspectBehavior([{ ...evidenceCase, pass: false }])).toEqual({
      adaptivePath: false,
      secondFollowUp: false,
      deterministicCap: false,
      malformedOutputSafe: false,
    });
  });

  it("reports either sensitivity mutation that survives", () => {
    expect(
      sensitivityFailures({
        alwaysMoveOnRejected: false,
        alwaysFollowUpRejected: false,
      }),
    ).toHaveLength(2);
    expect(
      sensitivityFailures({
        alwaysMoveOnRejected: true,
        alwaysFollowUpRejected: true,
      }),
    ).toEqual([]);
  });
});
