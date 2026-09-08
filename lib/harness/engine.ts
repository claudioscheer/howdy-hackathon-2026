import { type AnswerEvaluator } from "../interview/contracts";
import { sessionReducer } from "../interview/reducer";
import { createSeededSession } from "../interview/seed";
import { type SessionState } from "../interview/session";
import { submitAnswer } from "../interview/turn";
import {
  type EvalScenario,
  type ScenarioStep,
  type StepObservation,
} from "./fixtures";

export interface ScenarioRun {
  scenario: EvalScenario;
  steps: StepObservation[];
  pass: boolean;
}

function unchangedState(left: SessionState, right: SessionState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function stepMatchesExpected(
  step: ScenarioStep,
  observation: StepObservation,
): boolean {
  const expected = step.expected;
  return (
    observation.outcome === expected.outcome &&
    (expected.recommendedDecision === undefined ||
      observation.recommendedDecision === expected.recommendedDecision) &&
    (expected.dimension === undefined ||
      observation.dimension === expected.dimension) &&
    observation.questionIndex === expected.questionIndex &&
    observation.followUpCount === expected.followUpCount &&
    observation.historyLength === expected.historyLength &&
    observation.status === expected.status &&
    (expected.stateUnchanged === undefined ||
      observation.stateUnchanged === expected.stateUnchanged)
  );
}

export async function runScenario(
  scenario: EvalScenario,
  evaluator: AnswerEvaluator,
): Promise<ScenarioRun> {
  let state = sessionReducer(createSeededSession(), { type: "START_SESSION" });
  const observations: StepObservation[] = [];

  for (const step of scenario.steps) {
    const before = state;
    const result = await submitAnswer(state, step.answer, evaluator);
    state = result.state;
    const observation: StepObservation = {
      outcome: result.ok ? "APPLIED" : "REJECTED",
      recommendedDecision: result.ok ? result.decision.decision : undefined,
      dimension:
        result.ok && result.decision.decision === "FOLLOW_UP"
          ? result.decision.dimension
          : undefined,
      questionIndex: state.questionIndex,
      followUpCount: state.followUpCount,
      historyLength: state.history.length,
      status: state.status,
      stateUnchanged: unchangedState(before, state),
    };
    observations.push(observation);
  }

  return {
    scenario,
    steps: observations,
    pass: scenario.steps.every((step, index) => {
      const observation = observations[index];
      return (
        observation !== undefined && stepMatchesExpected(step, observation)
      );
    }),
  };
}
