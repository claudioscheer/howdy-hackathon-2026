import {
  type AnswerEvaluationInput,
  type AnswerEvaluator,
  type InterviewerDecision,
} from "../interview/contracts";
import { runScenario } from "./engine";
import { type EvalScenario } from "./fixtures";

const ALWAYS_MOVE_ON: InterviewerDecision = {
  decision: "MOVE_ON",
  reason: "Mutation always advances regardless of answer quality.",
};

const ALWAYS_FOLLOW_UP: InterviewerDecision = {
  decision: "FOLLOW_UP",
  reason: "Mutation always follows up regardless of answer quality.",
  dimension: "specificity",
  followUp: "Mutation asks another question every time.",
};

class ConstantDecisionEvaluator implements AnswerEvaluator {
  constructor(private readonly decision: InterviewerDecision) {}

  async evaluate(_input: AnswerEvaluationInput): Promise<unknown> {
    return this.decision;
  }
}

export interface SensitivityResult {
  alwaysMoveOnRejected: boolean;
  alwaysFollowUpRejected: boolean;
}

async function mutationIsRejected(
  scenarios: EvalScenario[],
  decision: InterviewerDecision,
): Promise<boolean> {
  const evaluator = new ConstantDecisionEvaluator(decision);
  for (const scenario of scenarios.filter(
    (candidate) => candidate.evaluator === "SCRIPTED",
  )) {
    const result = await runScenario(scenario, evaluator);
    if (!result.pass) {
      return true;
    }
  }
  return false;
}

export async function runSensitivityChecks(
  scenarios: EvalScenario[],
): Promise<SensitivityResult> {
  return {
    alwaysMoveOnRejected: await mutationIsRejected(scenarios, ALWAYS_MOVE_ON),
    alwaysFollowUpRejected: await mutationIsRejected(
      scenarios,
      ALWAYS_FOLLOW_UP,
    ),
  };
}
