import fs from "node:fs";
import path from "node:path";
import {
  blankAnswerDecision,
  InterviewerDecisionSchema,
  isBlankAnswer,
  MAX_FOLLOW_UPS_PER_QUESTION,
  resolveDecisionWithPolicy,
  validateTranscriptGrounding,
} from "./schema";

export interface Proof {
  pass: boolean;
  evidence: string;
}

export const REQUIRED_LANDING_TEST_IDS = [
  "app-badge",
  "hero-title",
  "hero-description",
  "start-practice",
  "harness-hint",
] as const;

export function proveSchemaContract(): Proof {
  const missingFollowUp = InterviewerDecisionSchema.safeParse({
    decision: "FOLLOW_UP",
    dimension: "specificity",
    reason: "Answer was generic.",
  });
  const missingDimension = InterviewerDecisionSchema.safeParse({
    decision: "FOLLOW_UP",
    followUp: "Can you clarify the example?",
    reason: "Answer was generic.",
  });
  const valid = InterviewerDecisionSchema.safeParse({
    decision: "FOLLOW_UP",
    dimension: "specificity",
    followUp: "Can you provide a concrete incident?",
    reason: "Answer was generic.",
  });
  return {
    pass:
      missingFollowUp.success === false &&
      missingDimension.success === false &&
      valid.success,
    evidence:
      "lib/harness/schema.ts#InterviewerDecisionSchema (positive FOLLOW_UP and two negatives)",
  };
}

export function proveGroundingContract(): Proof {
  const transcript =
    "Candidate: We reduced latency from 450ms to 45ms using connection pooling.";
  const grounded = validateTranscriptGrounding(
    [
      {
        quote: "reduced latency from 450ms to 45ms",
        dimension: "specificity",
        feedback: "Concrete metric cited.",
      },
    ],
    transcript,
  );
  const fabricated = validateTranscriptGrounding(
    [
      {
        quote: "we spent the first 90 seconds on unrelated work",
        dimension: "relevance",
        feedback: "Fabricated quote.",
      },
    ],
    transcript,
  );
  const emptyQuote = validateTranscriptGrounding(
    [
      {
        quote: "",
        dimension: "structure",
        feedback: "Empty quote.",
      },
    ],
    transcript,
  );
  return {
    pass: grounded.valid && !fabricated.valid && !emptyQuote.valid,
    evidence:
      "lib/harness/schema.ts#validateTranscriptGrounding (substring pass, fabricated fail, empty fail)",
  };
}

export function proveStateCapContract(): Proof {
  const capped = resolveDecisionWithPolicy(
    {
      decision: "FOLLOW_UP",
      dimension: "specificity",
      followUp: "Can you be more concrete?",
      reason: "Candidate was vague.",
    },
    {
      questionId: "q1",
      followUpCount: MAX_FOLLOW_UPS_PER_QUESTION,
      isComplete: false,
    },
  );
  const underCap = resolveDecisionWithPolicy(
    {
      decision: "FOLLOW_UP",
      dimension: "specificity",
      followUp: "Can you be more concrete?",
      reason: "Candidate was vague.",
    },
    { questionId: "q1", followUpCount: 0, isComplete: false },
  );
  return {
    pass:
      capped.finalDecision === "MOVE_ON" &&
      capped.isCapped &&
      underCap.finalDecision === "FOLLOW_UP" &&
      !underCap.isCapped,
    evidence: "lib/harness/schema.ts#resolveDecisionWithPolicy",
  };
}

export function proveEmptyAnswerContract(): Proof {
  const decision = blankAnswerDecision();
  return {
    pass:
      isBlankAnswer("") &&
      isBlankAnswer("   ") &&
      !isBlankAnswer("I shipped it.") &&
      decision.decision === "FOLLOW_UP" &&
      decision.dimension === "specificity",
    evidence: "lib/harness/schema.ts#blankAnswerDecision",
  };
}

export function proveLandingContract(rootDir: string): Proof {
  const pagePath = path.join(rootDir, "app/page.tsx");
  if (!fs.existsSync(pagePath)) {
    return { pass: false, evidence: "app/page.tsx is missing" };
  }
  const source = fs.readFileSync(pagePath, "utf8");
  const missing = REQUIRED_LANDING_TEST_IDS.filter(
    (id) => !source.includes(`data-testid="${id}"`),
  );
  return {
    pass: missing.length === 0,
    evidence:
      missing.length === 0
        ? "app/page.tsx data-testid markers"
        : `app/page.tsx missing data-testid: ${missing.join(", ")}`,
  };
}
