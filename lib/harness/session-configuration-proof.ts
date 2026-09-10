import { sessionFromOpportunity } from "../interview/practice-session";
import { sessionReducer } from "../interview/reducer";
import type { SessionState } from "../interview/session";
import type { Proof } from "./contracts";

type OpportunityPracticeRow = Parameters<typeof sessionFromOpportunity>[0];

function fictionalRow(): OpportunityPracticeRow {
  const storedAt = new Date("2026-09-10T00:00:00.000Z");
  return {
    id: "opportunity-proof",
    role: "platform",
    seniority: "staff",
    targetTechStack: ["Kubernetes", "Terraform"],
    interviewType: "technical",
    jobDescription: "Own fictional platform reliability.",
    status: "Active",
    questionPrepStatus: "ready",
    targetMinutes: 40,
    sessionAnswerBudget: 6,
    attemptsLimit: 2,
    attemptsUsed: 0,
    token: "proof-token",
    practiceSessionId: "persisted-practice-proof",
    createdAt: storedAt,
    updatedAt: storedAt,
    candidate: {
      id: "candidate-proof",
      displayName: "Morgan Chen",
      curriculum: "Fictional platform engineering experience.",
      opportunityId: "opportunity-proof",
      createdAt: storedAt,
    },
    questions: [
      {
        id: "question-proof-reliability",
        opportunityId: "opportunity-proof",
        prompt: "Describe a reliability incident you personally resolved.",
        sortOrder: 0,
        primaryDimension: "specificity",
        importance: null,
        competency: null,
        brief: null,
        createdAt: storedAt,
      },
      {
        id: "question-proof-failover",
        opportunityId: "opportunity-proof",
        prompt: "How would you validate regional failover?",
        sortOrder: 1,
        primaryDimension: "fundamentals",
        importance: null,
        competency: null,
        brief: null,
        createdAt: storedAt,
      },
    ],
  };
}

interface SessionConfigurationSnapshot {
  sessionId: string;
  candidateId: string;
  opportunityId: string;
  questionIds: string[];
  openingTurns: string[];
  sessionAnswerBudget: number;
}

export interface SessionConfigurationProof extends Proof {
  snapshot?: SessionConfigurationSnapshot;
  invalidConfigurationRejected: boolean;
}

export function buildSessionConfigurationProof(
  planned: SessionState | null,
  invalidConfigurationRejected: boolean,
): SessionConfigurationProof {
  if (planned === null) {
    return {
      pass: false,
      evidence: "the product practice-session constructor rejected valid data",
      invalidConfigurationRejected,
    };
  }
  const opened = sessionReducer(planned, { type: "START_SESSION" });
  const snapshot: SessionConfigurationSnapshot = {
    sessionId: opened.sessionId,
    candidateId: opened.candidate.id,
    opportunityId: opened.opportunity.id,
    questionIds: opened.questions.map((question) => question.id),
    openingTurns: opened.history.map((turn) => turn.content),
    sessionAnswerBudget: opened.sessionAnswerBudget,
  };
  const expected: SessionConfigurationSnapshot = {
    sessionId: "persisted-practice-proof",
    candidateId: "candidate-proof",
    opportunityId: "opportunity-proof",
    questionIds: ["question-proof-reliability", "question-proof-failover"],
    openingTurns: ["Describe a reliability incident you personally resolved."],
    sessionAnswerBudget: 6,
  };
  return {
    pass:
      JSON.stringify(snapshot) === JSON.stringify(expected) &&
      invalidConfigurationRejected,
    evidence:
      "evals/traces/latest-eval.json#layer1.sessionConfiguration uses lib/interview/practice-session and the product reducer",
    snapshot,
    invalidConfigurationRejected,
  };
}

export function proveSessionConfiguration(): SessionConfigurationProof {
  const row = fictionalRow();
  return buildSessionConfigurationProof(
    sessionFromOpportunity(row, "persisted-practice-proof"),
    sessionFromOpportunity({ ...row, questions: [] }, "invalid-proof") === null,
  );
}
