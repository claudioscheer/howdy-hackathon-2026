import {
  InterviewerDecision,
  InterviewerDecisionSchema,
  QuestionState,
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

/**
 * Deterministic Stub Provider for Layer 0 & Layer 1 CI gates.
 * Allows predictable, instantaneous offline testing without API keys.
 */
export class DeterministicStubProvider implements DecisionProvider {
  private stubMap = new Map<string, InterviewerDecision>();

  registerStub(answerSubstring: string, decision: InterviewerDecision) {
    this.stubMap.set(answerSubstring.toLowerCase(), decision);
  }

  async evaluate(input: EvaluationInput): Promise<unknown> {
    const lowerAnswer = input.answer.toLowerCase();

    // Check if any registered stub substring matches
    for (const [key, decision] of this.stubMap.entries()) {
      if (lowerAnswer.includes(key)) {
        return decision;
      }
    }

    // Heuristic fallbacks for deterministic mock evaluation
    if (
      lowerAnswer.includes("always communicate well") ||
      lowerAnswer.includes("good communicator") ||
      lowerAnswer.includes("i work hard and deliver results")
    ) {
      return {
        decision: "FOLLOW_UP",
        reason: "The answer makes high-level claims without citing a concrete example, metric, or situation.",
        dimension: "specificity",
        followUp: "Can you describe a specific time when that communication changed an outcome? Walk me through what happened.",
      };
    }

    if (
      lowerAnswer.includes("2018") ||
      lowerAnswer.includes("back at my first job") ||
      lowerAnswer.includes("jquery and php 5")
    ) {
      return {
        decision: "FOLLOW_UP",
        reason: "The candidate relied heavily on an older, less relevant experience instead of current hands-on experience.",
        dimension: "relevance",
        followUp: "That was several years ago—how have you applied those concepts recently in your current stack?",
      };
    }

    if (
      lowerAnswer.includes("i really love agile standups") &&
      input.question.toLowerCase().includes("database")
    ) {
      return {
        decision: "FOLLOW_UP",
        reason: "The response wanders to general agile practices rather than answering the technical database question.",
        dimension: "structure",
        followUp: "Let's bring it back to the database design question: how would you index this specific table?",
      };
    }

    if (
      (lowerAnswer.includes("as a principal architect") || lowerAnswer.includes("as a senior full-stack")) &&
      (lowerAnswer.includes("select * from users where id in (select") || lowerAnswer.includes("i don't use indexes"))
    ) {
      return {
        decision: "FOLLOW_UP",
        reason: "Senior claims coupled with a breakdown on fundamental querying and indexing concepts.",
        dimension: "fundamentals",
        followUp: "What is the query performance implication of an unindexed subquery at scale, and how would you optimize it?",
      };
    }

    // Default to MOVE_ON if answer contains concrete metrics, tradeoffs, or technologies
    return {
      decision: "MOVE_ON",
      reason: "The candidate answered concretely with relevant technical depth.",
    };
  }
}

/**
 * The Interview Decision Engine:
 * Coordinates provider execution, enforces Layer 0 schema validation,
 * and applies state-machine policies.
 */
export class InterviewEngine {
  constructor(private provider: DecisionProvider) {}

  async evaluateTurn(
    input: EvaluationInput,
    currentState: QuestionState
  ): Promise<EvaluationResult> {
    const rawResult = await this.provider.evaluate(input);

    // Layer 0 Gate: Validate JSON schema against strict contract
    const parsed = InterviewerDecisionSchema.safeParse(rawResult);
    if (!parsed.success) {
      throw new Error(
        `Layer 0 Contract Violation: Invalid decision schema from provider: ${JSON.stringify(
          parsed.error.format()
        )}`
      );
    }

    const decision = parsed.data;

    // Layer 0 Gate: Apply state machine policy (e.g. follow-up cap)
    const policyResult = resolveDecisionWithPolicy(decision, currentState);

    return {
      decision,
      finalDecision: policyResult.finalDecision,
      isCapped: policyResult.isCapped,
      rawOutput: rawResult,
    };
  }
}
