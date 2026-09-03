import {
  type DecisionProvider,
  InterviewEngine,
  type EvaluationResult,
} from "./engine";
import { type EvalFixture, fixtureState, matchesExpected } from "./fixtures";
import { type InterviewerDecision } from "./schema";

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

class ConstantDecisionProvider implements DecisionProvider {
  constructor(private readonly decision: InterviewerDecision) {}

  async evaluate(): Promise<unknown> {
    return this.decision;
  }
}

export interface SensitivityResult {
  alwaysMoveOnRejected: boolean;
  alwaysFollowUpRejected: boolean;
}

async function fixtureMatches(
  fixture: EvalFixture,
  engine: InterviewEngine,
): Promise<boolean> {
  const result: EvaluationResult = await engine.evaluateTurn(
    fixture.input,
    fixtureState(fixture),
  );
  return matchesExpected(fixture, result);
}

async function mutationIsRejected(
  fixtures: EvalFixture[],
  decision: InterviewerDecision,
): Promise<boolean> {
  const engine = new InterviewEngine(new ConstantDecisionProvider(decision));
  for (const fixture of fixtures) {
    if (!(await fixtureMatches(fixture, engine))) {
      return true;
    }
  }
  return false;
}

export async function runSensitivityChecks(
  fixtures: EvalFixture[],
): Promise<SensitivityResult> {
  return {
    alwaysMoveOnRejected: await mutationIsRejected(fixtures, ALWAYS_MOVE_ON),
    alwaysFollowUpRejected: await mutationIsRejected(
      fixtures,
      ALWAYS_FOLLOW_UP,
    ),
  };
}
