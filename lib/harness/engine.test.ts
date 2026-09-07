import path from "node:path";
import { describe, expect, it } from "vitest";
import { type AnswerEvaluator } from "../interview/contracts";
import { ScriptedAnswerEvaluator } from "../interview/evaluator";
import { runScenario, stepMatchesExpected } from "./engine";
import {
  EvalScenarioSchema,
  loadScenariosFromDir,
  type StepObservation,
} from "./fixtures";

const repoRoot = path.resolve(import.meta.dirname, "../..");

describe("public product runtime scenarios", () => {
  for (const scenario of [
    ...loadScenariosFromDir(path.join(repoRoot, "evals/goldens")),
    ...loadScenariosFromDir(path.join(repoRoot, "evals/holdouts")),
  ].filter((candidate) => candidate.evaluator === "SCRIPTED")) {
    it(`[${scenario.id}] ${scenario.description}`, async () => {
      const run = await runScenario(scenario, new ScriptedAnswerEvaluator());
      expect(run.pass).toBe(true);
    });
  }

  it("records a rejected, unchanged turn for invalid evaluator output", async () => {
    const scenario = loadScenariosFromDir(
      path.join(repoRoot, "evals/goldens"),
    ).find((candidate) => candidate.evaluator === "MALFORMED");
    expect(scenario).toBeDefined();
    if (scenario === undefined) return;
    const evaluator: AnswerEvaluator = {
      evaluate: async () => ({ decision: "FOLLOW_UP" }),
    };
    const run = await runScenario(scenario, evaluator);
    expect(run.pass).toBe(true);
    expect(run.steps[0]?.stateUnchanged).toBe(true);
  });
});

describe("step matching", () => {
  const observation: StepObservation = {
    outcome: "APPLIED",
    recommendedDecision: "FOLLOW_UP",
    dimension: "specificity",
    questionIndex: 0,
    followUpCount: 1,
    historyLength: 3,
    status: "AWAITING_ANSWER",
    stateUnchanged: false,
  };
  const scenario = EvalScenarioSchema.parse({
    id: "matching",
    description: "Matcher branch coverage.",
    steps: [
      {
        answer: "Weak answer here.",
        expected: { ...observation },
      },
    ],
  });

  it("checks optional and required observation fields", () => {
    const step = scenario.steps[0];
    expect(step).toBeDefined();
    if (step === undefined) return;
    expect(stepMatchesExpected(step, observation)).toBe(true);
    expect(
      stepMatchesExpected(step, { ...observation, followUpCount: 2 }),
    ).toBe(false);
    const withoutOptional = EvalScenarioSchema.parse({
      ...scenario,
      steps: [
        {
          answer: "Weak answer here.",
          expected: {
            outcome: "APPLIED",
            questionIndex: 0,
            followUpCount: 1,
            historyLength: 3,
            status: "AWAITING_ANSWER",
          },
        },
      ],
    }).steps[0];
    expect(withoutOptional).toBeDefined();
    if (withoutOptional === undefined) return;
    expect(stepMatchesExpected(withoutOptional, observation)).toBe(true);
  });

  it("marks a scenario failed when an expected transition differs", async () => {
    const mismatched = EvalScenarioSchema.parse({
      ...scenario,
      steps: [
        {
          ...scenario.steps[0],
          expected: { ...observation, questionIndex: 2 },
        },
      ],
    });
    expect(
      (await runScenario(mismatched, new ScriptedAnswerEvaluator())).pass,
    ).toBe(false);
  });
});
