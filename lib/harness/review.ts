import { type EvalScenario } from "./fixtures";
import {
  collectChangedFiles,
  mapFilesToCriteria,
  reviewChangedFiles,
} from "./review-diff";
import { reviewEvalSuite } from "./review-suite";

export interface ReviewInput {
  goldens: EvalScenario[];
  holdouts: EvalScenario[];
  rootDir: string;
  changedFiles?: string[];
}

export interface ReviewReport {
  findings: string[];
  changedFiles: string[];
  mappedCriteria: string[];
}

export function reviewHarness(input: ReviewInput): ReviewReport {
  const changedFiles = input.changedFiles ?? collectChangedFiles(input.rootDir);
  const findings = [
    ...reviewEvalSuite({
      goldens: input.goldens,
      holdouts: input.holdouts,
    }),
    ...reviewChangedFiles(input.rootDir, changedFiles),
  ];
  return {
    findings,
    changedFiles,
    mappedCriteria: mapFilesToCriteria(changedFiles),
  };
}

export {
  collectChangedFiles,
  colocatedTestPath,
  defaultExecGit,
  isSecretPath,
  mapFilesToCriteria,
  reviewChangedFiles,
} from "./review-diff";
export {
  answerSimilarityFailure,
  behaviorCoverageFailures,
  duplicateIdFailures,
  independenceFailures,
  MAX_HOLDOUT_JACCARD,
  reviewEvalSuite,
} from "./review-suite";
