import { describe, expect, it } from "vitest";
import { REPORT_EVALUATOR_SYSTEM_PROMPT } from "./report-evaluator-prompt";

describe("REPORT_EVALUATOR_SYSTEM_PROMPT", () => {
  it("requires grounded quotes and insufficient evidence for missing signal", () => {
    expect(REPORT_EVALUATOR_SYSTEM_PROMPT).toContain(
      "exact non-empty substring",
    );
    expect(REPORT_EVALUATOR_SYSTEM_PROMPT).toContain("insufficient_evidence");
    expect(REPORT_EVALUATOR_SYSTEM_PROMPT).toContain("candidate_ended_early");
    expect(REPORT_EVALUATOR_SYSTEM_PROMPT).toContain("Do not invent quotes");
    expect(REPORT_EVALUATOR_SYSTEM_PROMPT).toContain("unanswered follow-up");
  });
});
