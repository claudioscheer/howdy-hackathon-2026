import { decideStub } from "./heuristics";
import {
  blankAnswerDecision,
  type EvaluationInput,
  type InterviewerDecision,
  InterviewerDecisionSchema,
  isBlankAnswer,
  type QuestionState,
  resolveDecisionWithPolicy,
} from "./schema";

export type { EvaluationInput };

export interface EvaluationResult {
  decision: InterviewerDecision;
  finalDecision: "FOLLOW_UP" | "MOVE_ON";
  isCapped: boolean;
  rawOutput?: unknown;
}

export interface DecisionProvider {
  evaluate(input: EvaluationInput): Promise<unknown>;
}

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

    return decideStub(input);
  }
}

export class InterviewEngine {
  constructor(private readonly provider: DecisionProvider) {}

  async evaluateTurn(
    input: EvaluationInput,
    currentState: QuestionState,
  ): Promise<EvaluationResult> {
    const rawResult = isBlankAnswer(input.answer)
      ? blankAnswerDecision()
      : await this.provider.evaluate(input);
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
