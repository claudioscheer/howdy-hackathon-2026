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

  it("asks for specificity when an answer only makes a general claim", async () => {
    await expect(
      evaluator.evaluate(input("I am a good communicator and team player.")),
    ).resolves.toMatchObject({
      decision: "FOLLOW_UP",
      dimension: "specificity",
    });
  });

  it("moves on for varied answers containing concrete evidence", async () => {
    const answers = [
      "I traced the API latency and reduced it by 35 percent.",
      "We implemented a PostgreSQL index after measuring slow queries.",
      "I resolved the deployment issue and shipped the service that day.",
    ];

    for (const answer of answers) {
      await expect(evaluator.evaluate(input(answer))).resolves.toMatchObject({
        decision: "MOVE_ON",
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
  });
});
