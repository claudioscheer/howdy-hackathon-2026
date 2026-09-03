import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { type EvaluationResult } from "./engine";
import {
  DecisionTypeSchema,
  EvaluationInputSchema,
  QuestionStateSchema,
  type QuestionState,
  RubricDimensionSchema,
} from "./schema";

export const FixtureExpectedSchema = z
  .object({
    decision: DecisionTypeSchema.optional(),
    dimension: RubricDimensionSchema.optional(),
    finalDecision: DecisionTypeSchema.optional(),
    isCapped: z.boolean().optional(),
  })
  .refine(
    (expected) =>
      expected.decision !== undefined || expected.finalDecision !== undefined,
    { message: "expected.decision or expected.finalDecision is required" },
  );

export const EvalFixtureSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1),
    input: EvaluationInputSchema,
    state: QuestionStateSchema.optional(),
    expected: FixtureExpectedSchema,
  })
  .strict();

export type EvalFixture = z.infer<typeof EvalFixtureSchema>;

export function defaultQuestionState(questionId: string): QuestionState {
  return {
    questionId,
    followUpCount: 0,
    isComplete: false,
  };
}

export function fixtureState(fixture: EvalFixture): QuestionState {
  return fixture.state ?? defaultQuestionState(fixture.id);
}

export function loadFixtureFile(filePath: string): EvalFixture {
  const raw: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = EvalFixtureSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid fixture ${filePath}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function loadFixturesFromDir(dir: string): EvalFixture[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => loadFixtureFile(path.join(dir, file)));
}

export function matchesProductExpected(
  expected: EvalFixture["expected"],
  res: Pick<EvaluationResult, "decision" | "finalDecision" | "isCapped">,
): boolean {
  if (expected.decision && res.decision.decision !== expected.decision) {
    return false;
  }
  if (
    expected.dimension &&
    (res.decision.decision !== "FOLLOW_UP" ||
      res.decision.dimension !== expected.dimension)
  ) {
    return false;
  }
  if (expected.finalDecision && res.finalDecision !== expected.finalDecision) {
    return false;
  }
  if (expected.isCapped !== undefined && res.isCapped !== expected.isCapped) {
    return false;
  }
  return true;
}

export function matchesExpected(
  fixture: EvalFixture,
  res: Pick<EvaluationResult, "decision" | "finalDecision" | "isCapped">,
): boolean {
  return matchesProductExpected(fixture.expected, res);
}
