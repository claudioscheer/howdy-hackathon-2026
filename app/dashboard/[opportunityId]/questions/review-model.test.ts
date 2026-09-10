import { describe, expect, it } from "vitest";
import {
  applyQuestionEdit,
  emptyReviewQuestion,
  fieldsFromBrief,
} from "./review-model";

describe("question review model", () => {
  it("keeps the brief when the edit is not material", () => {
    const previous = {
      ...emptyReviewQuestion(),
      prompt: "Tell me about a conflict.",
      competency: "Conflict resolution",
      expectedDepth: "A disagreement and a decision.",
    };
    expect(
      applyQuestionEdit(previous, {
        ...previous,
        importance: "core",
      }),
    ).toEqual({
      ...previous,
      importance: "core",
    });
  });

  it("clears stale assessment criteria after a material prompt edit", () => {
    const previous = {
      ...emptyReviewQuestion(),
      prompt: "Tell me about a conflict.",
      competency: "Conflict resolution",
      roleRelevance: "Seniors resolve disagreements.",
      expectedDepth: "A disagreement and a decision.",
      evidenceToListenFor: "disagreement",
      followUpTriggers: "no conflict",
      stopWhen: "a decision is described",
    };
    const next = applyQuestionEdit(previous, {
      ...previous,
      prompt: "Tell me about a caching tradeoff.",
    });
    expect(next.expectedDepth).toBe("");
    expect(next.evidenceToListenFor).toBe("");
    expect(next.followUpTriggers).toBe("");
    expect(next.stopWhen).toBe("");
    expect(next.roleRelevance).toBe("Seniors resolve disagreements.");
  });

  it("clears role relevance when the competency changes", () => {
    const previous = {
      ...emptyReviewQuestion(),
      prompt: "Tell me about a conflict.",
      competency: "Conflict resolution",
      roleRelevance: "Seniors resolve disagreements.",
    };
    const next = applyQuestionEdit(previous, {
      ...previous,
      competency: "Caching",
    });
    expect(next.roleRelevance).toBe("");
  });

  it("maps a stored brief onto review fields", () => {
    expect(
      fieldsFromBrief("Prompt?", "specificity", "", "", {
        competency: "Ownership",
        roleRelevance: "Seniors own delivery.",
        importance: "core",
        expectedDepth: "A recent owned example.",
        evidenceToListenFor: ["owned action"],
        followUpTriggers: ["missing ownership"],
        timeBudgetMinutes: 8,
        answerBudget: 3,
        maxFollowUps: 2,
        stopWhen: ["ownership is present"],
      }),
    ).toMatchObject({
      competency: "Ownership",
      importance: "core",
      evidenceToListenFor: "owned action",
      timeBudgetMinutes: "8",
    });
  });
});
