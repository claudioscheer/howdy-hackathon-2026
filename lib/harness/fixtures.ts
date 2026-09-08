import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  DecisionTypeSchema,
  RubricDimensionSchema,
} from "../interview/contracts";
import { SessionStatusSchema } from "../interview/session";

export const StepExpectedSchema = z
  .object({
    outcome: z.enum(["APPLIED", "REJECTED"]),
    recommendedDecision: DecisionTypeSchema.optional(),
    dimension: RubricDimensionSchema.optional(),
    questionIndex: z.number().int().nonnegative(),
    followUpCount: z.number().int().nonnegative(),
    historyLength: z.number().int().nonnegative(),
    status: SessionStatusSchema,
    stateUnchanged: z.boolean().optional(),
  })
  .strict();

export const ScenarioStepSchema = z
  .object({
    answer: z.string().min(1),
    expected: StepExpectedSchema,
  })
  .strict();

export const EvalScenarioSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1),
    evaluator: z.enum(["SCRIPTED", "MALFORMED"]).default("SCRIPTED"),
    steps: z.array(ScenarioStepSchema).min(1),
  })
  .strict();

export type EvalScenario = z.infer<typeof EvalScenarioSchema>;
export type ScenarioStep = z.infer<typeof ScenarioStepSchema>;
export type StepObservation = {
  outcome: "APPLIED" | "REJECTED";
  recommendedDecision?: "FOLLOW_UP" | "MOVE_ON";
  dimension?: z.infer<typeof RubricDimensionSchema>;
  questionIndex: number;
  followUpCount: number;
  historyLength: number;
  status: z.infer<typeof SessionStatusSchema>;
  stateUnchanged: boolean;
};

export function loadScenarioFile(filePath: string): EvalScenario {
  const raw: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = EvalScenarioSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid scenario ${filePath}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function loadScenariosFromDir(dir: string): EvalScenario[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => loadScenarioFile(path.join(dir, file)));
}
