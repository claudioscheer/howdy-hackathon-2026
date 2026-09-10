import { describe, expect, it } from "vitest";
import { PLANNER_SYSTEM_PROMPT } from "./planner-prompt";

describe("planner prompt", () => {
  it("asks for a four-question interview arc instead of three prompts", () => {
    expect(PLANNER_SYSTEM_PROMPT).toContain("close to 40 minutes");
    expect(PLANNER_SYSTEM_PROMPT).not.toContain("exactly 4 questions");
    expect(PLANNER_SYSTEM_PROMPT).not.toContain("exactly 3 questions");
    expect(PLANNER_SYSTEM_PROMPT).toContain(
      "Do not use a fixed question count",
    );
    expect(PLANNER_SYSTEM_PROMPT).toContain("allocates attention");
    expect(PLANNER_SYSTEM_PROMPT).toContain(
      "Missing evidence justifies pushback",
    );
    expect(PLANNER_SYSTEM_PROMPT).toContain("system_design");
  });
});
