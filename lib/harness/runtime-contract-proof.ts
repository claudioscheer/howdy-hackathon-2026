import {
  AnswerEvaluationInputSchema,
  QuestionPlanSchema,
  SessionReportSchema,
} from "../interview/contracts";
import { SessionEventSchema, SessionStateSchema } from "../interview/session";
import { type Proof } from "./contracts";

const opportunity = {
  id: "fictional-role",
  role: "Engineer",
  seniority: "Senior",
  targetTechStack: ["TypeScript"],
  interviewType: "technical",
} as const;

const question = {
  id: "q1",
  prompt: "Describe a recent production incident.",
  primaryDimension: "specificity",
} as const;

export function proveRuntimeContractSet(): Proof {
  const planValid = QuestionPlanSchema.safeParse({ questions: [question] });
  const planInvalid = QuestionPlanSchema.safeParse({ questions: [] });
  const evaluationValid = AnswerEvaluationInputSchema.safeParse({
    opportunity,
    question,
    answer: "I reduced P99 latency.",
    history: [],
  });
  const dimension = {
    status: "scored",
    score: 3,
    summary: "Needs more evidence.",
    evidence: [{ questionId: "q1", quote: "reduced P99 latency" }],
  };
  const reportValid = SessionReportSchema.safeParse({
    attemptNumber: 1,
    summary: "A useful first attempt.",
    dimensions: {
      relevance: dimension,
      specificity: dimension,
      fundamentals: dimension,
      structure: dimension,
    },
  });
  const stateInvalid = SessionStateSchema.safeParse({
    sessionId: "s1",
    status: "PLANNED",
    candidate: { id: "c1", displayName: "Alex Rivera" },
    opportunity,
    attemptNumber: 4,
    questions: [question],
    questionIndex: 0,
    followUpCount: 0,
    history: [],
    completedQuestionIds: [],
    usedQuestions: [],
  });
  const eventInvalid = SessionEventSchema.safeParse({
    type: "ANSWER_SUBMITTED",
    answer: "   ",
  });
  return {
    pass:
      planValid.success &&
      !planInvalid.success &&
      evaluationValid.success &&
      reportValid.success &&
      !stateInvalid.success &&
      !eventInvalid.success,
    evidence:
      "lib/interview/contracts.ts and lib/interview/session.ts positive and negative parses",
  };
}
