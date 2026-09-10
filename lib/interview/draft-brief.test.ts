import { describe, expect, it } from "vitest";
import {
  briefFieldsAreEmpty,
  briefFromFormFields,
  linesFromList,
} from "./draft-brief";

const complete = {
  competency: "Ownership",
  importance: "core",
  roleRelevance: "Seniors own delivery.",
  expectedDepth: "A recent owned example.",
  evidenceToListenFor: "owned action",
  followUpTriggers: "missing ownership",
  timeBudgetMinutes: "8",
  answerBudget: "3",
  maxFollowUps: "2",
  stopWhen: "ownership is present",
};

describe("draft briefs", () => {
  it("parses a complete brief and rejects a partial one", () => {
    expect(briefFromFormFields(complete)?.competency).toBe("Ownership");
    expect(
      briefFromFormFields({ ...complete, expectedDepth: "" }),
    ).toBeUndefined();
    expect(
      briefFieldsAreEmpty({ ...complete, competency: "", importance: "" }),
    ).toBe(false);
    expect(
      briefFieldsAreEmpty({
        competency: "",
        importance: "",
        roleRelevance: "",
        expectedDepth: "",
        evidenceToListenFor: "",
        followUpTriggers: "",
        timeBudgetMinutes: "",
        answerBudget: "",
        maxFollowUps: "",
        stopWhen: "",
      }),
    ).toBe(true);
    expect(linesFromList(["a", "b"])).toBe("a\nb");
    expect(
      briefFromFormFields({ ...complete, timeBudgetMinutes: "nope" }),
    ).toBeUndefined();
  });
});
