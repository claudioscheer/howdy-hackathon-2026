import { describe, expect, it } from "vitest";
import type { AnswerEvaluationInput } from "./contracts";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { createSeededSession } from "./seed";

function input(answer: string): AnswerEvaluationInput {
  const state = createSeededSession();
  const question = state.questions[0];
  if (question === undefined) {
    throw new Error("The seed must contain a question.");
  }
  return {
    opportunity: state.opportunity,
    question,
    answer,
    history: [],
  };
}

describe("ScriptedAnswerEvaluator", () => {
  const evaluator = new ScriptedAnswerEvaluator();

  it("asks for specificity when an on-topic answer only makes a general claim", async () => {
    await expect(
      evaluator.evaluate(
        input("I had a disagreement with a teammate but we figured it out."),
      ),
    ).resolves.toMatchObject({
      decision: "FOLLOW_UP",
      dimension: "specificity",
    });
  });

  it("follows up on relevance when a fluent React answer ignores a conflict question", async () => {
    const answer = "I used React for six months on a personal project";
    await expect(evaluator.evaluate(input(answer))).resolves.toMatchObject({
      decision: "FOLLOW_UP",
      dimension: "relevance",
      probePurpose: "relevance",
      evidence: [
        {
          quote: answer,
          supports: "The candidate has not answered the asked question.",
        },
      ],
    });
  });

  it("moves on for on-topic answers containing concrete evidence", async () => {
    const answers = [
      "I disagreed with a teammate on API latency and reduced it by 35 percent.",
      "We implemented a PostgreSQL index after a teammate disagreement over slow queries.",
      "I resolved a disagreement with a teammate and shipped the service that day.",
    ];

    for (const answer of answers) {
      await expect(evaluator.evaluate(input(answer))).resolves.toMatchObject({
        decision: "MOVE_ON",
        recommendedStopReason: "evidence_sufficient",
      });
    }
  });

  it("does not mistake a tiny keyword fragment or blank input for evidence", async () => {
    await expect(
      evaluator.evaluate(input("I built API 20")),
    ).resolves.toMatchObject({ decision: "FOLLOW_UP" });
    await expect(evaluator.evaluate(input("   "))).resolves.toMatchObject({
      decision: "FOLLOW_UP",
    });
    await expect(evaluator.evaluate(input(""))).resolves.toMatchObject({
      decision: "FOLLOW_UP",
    });
  });
});
