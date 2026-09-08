import path from "node:path";
import { describe, expect, it } from "vitest";
import { EvalScenarioSchema, loadScenariosFromDir } from "./fixtures";
import { runSensitivityChecks } from "./sensitivity";

describe("behavioral sensitivity", () => {
  it("rejects always-MOVE_ON and always-FOLLOW_UP against real transitions", async () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const scenarios = [
      ...loadScenariosFromDir(path.join(root, "evals/goldens")),
      ...loadScenariosFromDir(path.join(root, "evals/holdouts")),
    ];
    await expect(runSensitivityChecks(scenarios)).resolves.toEqual({
      alwaysMoveOnRejected: true,
      alwaysFollowUpRejected: true,
    });
  });

  it("shows that an empty or malformed-only suite rejects neither mutation", async () => {
    const malformed = EvalScenarioSchema.parse({
      id: "malformed-only",
      description: "Not eligible for mutation checks.",
      evaluator: "MALFORMED",
      steps: [
        {
          answer: "Some answer.",
          expected: {
            outcome: "REJECTED",
            questionIndex: 0,
            followUpCount: 0,
            historyLength: 1,
            status: "AWAITING_ANSWER",
          },
        },
      ],
    });
    await expect(runSensitivityChecks([malformed])).resolves.toEqual({
      alwaysMoveOnRejected: false,
      alwaysFollowUpRejected: false,
    });
  });

  it("shows when a move-only scenario cannot reject always-MOVE_ON", async () => {
    const moveOnly = EvalScenarioSchema.parse({
      id: "move-only",
      description: "Only expects one advancing turn.",
      steps: [
        {
          answer: "I led a TypeScript migration and cut errors by 30 percent.",
          expected: {
            outcome: "APPLIED",
            recommendedDecision: "MOVE_ON",
            questionIndex: 1,
            followUpCount: 0,
            historyLength: 3,
            status: "AWAITING_ANSWER",
          },
        },
      ],
    });
    const result = await runSensitivityChecks([moveOnly]);
    expect(result.alwaysMoveOnRejected).toBe(false);
    expect(result.alwaysFollowUpRejected).toBe(true);
  });
});
