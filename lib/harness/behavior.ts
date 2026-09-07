import { type CaseTrace } from "./report";
import { type SensitivityResult } from "./sensitivity";

export interface BehaviorEvidence {
  adaptivePath: boolean;
  secondFollowUp: boolean;
  deterministicCap: boolean;
  malformedOutputSafe: boolean;
}

export function sensitivityFailures(sensitivity: SensitivityResult): string[] {
  const failures: string[] = [];
  if (!sensitivity.alwaysMoveOnRejected) {
    failures.push(
      "Behavioral suite did not reject the always-MOVE_ON mutation",
    );
  }
  if (!sensitivity.alwaysFollowUpRejected) {
    failures.push(
      "Behavioral suite did not reject the always-FOLLOW_UP mutation",
    );
  }
  return failures;
}

export function inspectBehavior(cases: CaseTrace[]): BehaviorEvidence {
  const passed = cases.filter((item) => item.pass);
  return {
    adaptivePath: passed.some(
      (item) =>
        item.steps.some(
          (step) =>
            step.recommendedDecision === "FOLLOW_UP" &&
            step.dimension === "specificity" &&
            step.followUpCount === 1,
        ) &&
        item.steps.some(
          (step) =>
            step.recommendedDecision === "MOVE_ON" && step.questionIndex > 0,
        ),
    ),
    secondFollowUp: passed.some((item) =>
      item.steps.some(
        (step) =>
          step.recommendedDecision === "FOLLOW_UP" && step.followUpCount === 2,
      ),
    ),
    deterministicCap: passed.some((item) =>
      item.steps.some(
        (step) =>
          step.recommendedDecision === "FOLLOW_UP" &&
          step.questionIndex > 0 &&
          step.followUpCount === 0,
      ),
    ),
    malformedOutputSafe: passed.some((item) =>
      item.steps.some(
        (step) => step.outcome === "REJECTED" && step.stateUnchanged,
      ),
    ),
  };
}
