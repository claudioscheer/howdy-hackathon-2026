import { describe, expect, it } from "vitest";
import {
  InterviewerBriefSchema,
  canEnableBriefedEvaluation,
  parseInterviewerBrief,
  planReadiness,
} from "./brief";

const brief = {
  competency: "Conflict resolution",
  roleRelevance: "Seniors must resolve technical disagreement.",
  importance: "core" as const,
  expectedDepth:
    "A specific disagreement, the candidate's stance, and the outcome.",
  evidenceToListenFor: ["named teammate conflict", "owned decision"],
  followUpTriggers: ["missing ownership", "unsupported claim"],
  timeBudgetMinutes: 8,
  answerBudget: 3,
  maxFollowUps: 2 as const,
  stopWhen: ["ownership and outcome are present"],
};

describe("interviewer briefs", () => {
  it("accepts a complete brief and rejects an empty competency", () => {
    expect(InterviewerBriefSchema.safeParse(brief).success).toBe(true);
    expect(
      InterviewerBriefSchema.safeParse({ ...brief, competency: "" }).success,
    ).toBe(false);
  });

  it("does not enable briefed evaluation from prompt-only or mixed plans", () => {
    expect(planReadiness([{}])).toBe("prompt_only");
    expect(planReadiness([{}, { brief }])).toBe("briefs_incomplete");
    expect(planReadiness([{ brief }, { brief }])).toBe("briefed");
    expect(canEnableBriefedEvaluation([{}])).toBe(false);
    expect(canEnableBriefedEvaluation([{ brief }, { brief }])).toBe(true);
  });

  it("parses a stored interviewer brief and rejects junk", () => {
    expect(parseInterviewerBrief(brief)).toEqual(brief);
    expect(parseInterviewerBrief({ competency: "" })).toBeUndefined();
    expect(parseInterviewerBrief(undefined)).toBeUndefined();
  });
});
