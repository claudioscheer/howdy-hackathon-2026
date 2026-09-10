import type { InterviewQuestion } from "./contracts";
import { DEFAULT_SESSION_ANSWER_BUDGET, type SessionState } from "./session";

export const SEEDED_SESSION_ID = "fullstack-product-engineer";

export const SEEDED_QUESTION_PLAN: readonly InterviewQuestion[] = [
  {
    id: "question-collaboration",
    prompt:
      "Tell me about a time you worked through a difficult technical disagreement with a teammate.",
    primaryDimension: "specificity",
  },
  {
    id: "question-api-design",
    prompt:
      "Describe an API design decision you made and the tradeoffs you considered.",
    primaryDimension: "fundamentals",
  },
  {
    id: "question-delivery",
    prompt:
      "How have you reduced delivery risk while shipping an important product change?",
    primaryDimension: "structure",
  },
];

export function createSeededSession(
  sessionId: string = SEEDED_SESSION_ID,
): SessionState {
  return {
    sessionId,
    status: "PLANNED",
    candidate: {
      id: "candidate-alex-rivera",
      displayName: "Alex Rivera",
    },
    opportunity: {
      id: "opportunity-fullstack-product-engineer",
      role: "Fullstack Product Engineer",
      seniority: "Senior",
      targetTechStack: ["React", "Node.js", "PostgreSQL"],
      interviewType: "behavioral",
    },
    attemptNumber: 1,
    questions: SEEDED_QUESTION_PLAN.map((question) => ({ ...question })),
    questionIndex: 0,
    followUpCount: 0,
    sessionAnswerBudget: DEFAULT_SESSION_ANSWER_BUDGET,
    sessionAnswersUsed: 0,
    questionAnswersUsed: 0,
    evaluationPath: "basic",
    questionOutcomes: [],
    history: [],
    completedQuestionIds: [],
    usedQuestions: [],
  };
}
