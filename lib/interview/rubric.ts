import { z } from "zod";

export const RubricDimensionSchema = z.enum([
  "relevance",
  "specificity",
  "fundamentals",
  "structure",
]);
export type RubricDimension = z.infer<typeof RubricDimensionSchema>;
