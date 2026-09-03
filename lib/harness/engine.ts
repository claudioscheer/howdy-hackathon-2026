import {
  type InterviewerDecision,
  InterviewerDecisionSchema,
  type QuestionState,
  resolveDecisionWithPolicy,
} from "./schema";

export interface EvaluationInput {
  question: string;
  role: string;
  seniority: string;
  targetTechStack: string[];
  answer: string;
  history?: Array<{ role: "interviewer" | "candidate"; content: string }>;
}

export interface EvaluationResult {
  decision: InterviewerDecision;
  finalDecision: "FOLLOW_UP" | "MOVE_ON";
  isCapped: boolean;
  rawOutput?: unknown;
}

export interface DecisionProvider {
  evaluate(input: EvaluationInput): Promise<unknown>;
}

type Heuristic = {
  id: string;
  match: (input: EvaluationInput, answer: string) => boolean;
  decision: InterviewerDecision;
};

const HEURISTICS: Heuristic[] = [
  {
    id: "specificity",
    match: (_input, answer) =>
      answer.includes("always communicate well") ||
      answer.includes("good communicator") ||
      answer.includes("i work hard and deliver results"),
    decision: {
      decision: "FOLLOW_UP",
      reason:
        "The answer makes high-level claims without citing a concrete example, metric, or situation.",
      dimension: "specificity",
      followUp:
        "Can you describe a specific time when that communication changed an outcome? Walk me through what happened.",
    },
  },
  {
    id: "relevance",
    match: (_input, answer) =>
      answer.includes("2018") ||
      answer.includes("back at my first job") ||
      answer.includes("jquery and php 5"),
    decision: {
      decision: "FOLLOW_UP",
      reason:
        "The candidate relied heavily on an older, less relevant experience instead of current hands-on experience.",
      dimension: "relevance",
      followUp:
        "That was several years ago—how have you applied those concepts recently in your current stack?",
    },
  },
  {
    id: "structure",
    match: (input, answer) =>
      answer.includes("i really love agile standups") &&
      input.question.toLowerCase().includes("database"),
    decision: {
      decision: "FOLLOW_UP",
      reason:
        "The response wanders to general agile practices rather than answering the technical database question.",
      dimension: "structure",
      followUp:
        "Let's bring it back to the database design question: how would you index this specific table?",
    },
  },
  {
    id: "fundamentals",
    match: (_input, answer) => {
      const seniorVoice =
        answer.includes("as a principal architect") ||
        answer.includes("as a senior full-stack");
      const weakFundamentals =
        answer.includes("select * from users where id in (select") ||
        answer.includes("i don't use indexes");
      return seniorVoice && weakFundamentals;
    },
    decision: {
      decision: "FOLLOW_UP",
      reason:
        "Senior claims coupled with a breakdown on fundamental querying and indexing concepts.",
      dimension: "fundamentals",
      followUp:
        "What is the query performance implication of an unindexed subquery at scale, and how would you optimize it?",
    },
  },
];

const CONCRETE_MOVE_ON: InterviewerDecision = {
  decision: "MOVE_ON",
  reason: "The candidate answered concretely with relevant technical depth.",
};

export class DeterministicStubProvider implements DecisionProvider {
  private readonly stubMap = new Map<string, InterviewerDecision>();

  registerStub(answerSubstring: string, decision: InterviewerDecision): void {
    this.stubMap.set(answerSubstring.toLowerCase(), decision);
  }

  async evaluate(input: EvaluationInput): Promise<unknown> {
    const answer = input.answer.toLowerCase();

    for (const [key, decision] of this.stubMap.entries()) {
      if (answer.includes(key)) {
        return decision;
      }
    }

    const hit = HEURISTICS.find((heuristic) => heuristic.match(input, answer));
    return hit?.decision ?? CONCRETE_MOVE_ON;
  }
}

export class InterviewEngine {
  constructor(private readonly provider: DecisionProvider) {}

  async evaluateTurn(
    input: EvaluationInput,
    currentState: QuestionState,
  ): Promise<EvaluationResult> {
    const rawResult = await this.provider.evaluate(input);
    const parsed = InterviewerDecisionSchema.safeParse(rawResult);
    if (!parsed.success) {
      throw new Error(
        `Layer 0 Contract Violation: Invalid decision schema from provider: ${JSON.stringify(
          parsed.error.format(),
        )}`,
      );
    }

    const decision = parsed.data;
    const policyResult = resolveDecisionWithPolicy(decision, currentState);

    return {
      decision,
      finalDecision: policyResult.finalDecision,
      isCapped: policyResult.isCapped,
      rawOutput: rawResult,
    };
  }
}
