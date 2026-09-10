import { describe, expect, it } from "vitest";
import { RubricDimensionSchema } from "./rubric";

describe("rubric dimensions", () => {
  it("keeps competencies out of the scoring dimension enum", () => {
    expect(RubricDimensionSchema.safeParse("specificity").success).toBe(true);
    expect(RubricDimensionSchema.safeParse("database_design").success).toBe(
      false,
    );
  });
});
