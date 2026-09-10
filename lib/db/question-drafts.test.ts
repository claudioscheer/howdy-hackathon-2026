import { describe, expect, it } from "vitest";
import type { InterviewerBrief } from "@/lib/interview/brief";
import {
  draftFromInterviewQuestion,
  draftsFromFormData,
  interviewQuestionFromDraft,
  prismaQuestionData,
  storedBrief,
} from "./question-drafts";

const brief: InterviewerBrief = {
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
};

function appendBriefFields(
  formData: FormData,
  values: {
    roleRelevance?: string;
    expectedDepth?: string;
    evidence?: string;
    triggers?: string;
    timeBudget?: string;
    answerBudget?: string;
    maxFollowUps?: string;
    stopWhen?: string;
  } = {},
): void {
  formData.append("roleRelevance", values.roleRelevance ?? brief.roleRelevance);
  formData.append("expectedDepth", values.expectedDepth ?? brief.expectedDepth);
  formData.append(
    "evidenceToListenFor",
    values.evidence ?? brief.evidenceToListenFor.join("\n"),
  );
  formData.append(
    "followUpTriggers",
    values.triggers ?? brief.followUpTriggers.join("\n"),
  );
  formData.append(
    "timeBudgetMinutes",
    values.timeBudget ?? String(brief.timeBudgetMinutes),
  );
  formData.append(
    "answerBudget",
    values.answerBudget ?? String(brief.answerBudget),
  );
  formData.append(
    "maxFollowUps",
    values.maxFollowUps ?? String(brief.maxFollowUps),
  );
  formData.append("stopWhen", values.stopWhen ?? brief.stopWhen.join("\n"));
}

describe("question drafts", () => {
  it("keeps a complete brief and ignores malformed stored JSON", () => {
    expect(storedBrief(brief)).toEqual(brief);
    expect(storedBrief("{not json")).toBeUndefined();
    const draft = draftFromInterviewQuestion({
      id: "q-1",
      prompt: "What did you own?",
      primaryDimension: "specificity",
      brief,
    });
    expect(draft.brief).toEqual(brief);
    expect(prismaQuestionData("opp-2", draft, 0)).toMatchObject({
      prompt: "What did you own?",
      importance: "core",
      competency: "Ownership",
      brief,
    });
  });

  it("builds a complete brief from visible form fields", () => {
    const formData = new FormData();
    formData.append("prompt", "  What did you own?  ");
    formData.append("importance", "supporting");
    formData.append("competency", "Judgment");
    formData.append("primaryDimension", "fundamentals");
    appendBriefFields(formData);
    expect(draftsFromFormData(formData)).toEqual([
      {
        prompt: "What did you own?",
        primaryDimension: "fundamentals",
        importance: "supporting",
        competency: "Judgment",
        brief: {
          ...brief,
          importance: "supporting",
          competency: "Judgment",
        },
        briefIncomplete: false,
      },
    ]);
  });

  it("marks a partial brief incomplete instead of inventing fields", () => {
    const formData = new FormData();
    formData.append("prompt", "What did you own?");
    formData.append("importance", "core");
    formData.append("competency", "Ownership");
    formData.append("primaryDimension", "specificity");
    appendBriefFields(formData, { expectedDepth: "", evidence: "" });
    const draft = draftsFromFormData(formData)[0];
    expect(draft?.brief).toBeUndefined();
    expect(draft?.briefIncomplete).toBe(true);
  });

  it("reads a prompt-only form with no extra fields", () => {
    const formData = new FormData();
    formData.append("prompt", "Only the prompt");
    const drafts = draftsFromFormData(formData);
    expect(drafts).toEqual([
      {
        prompt: "Only the prompt",
        primaryDimension: "specificity",
        importance: undefined,
        competency: undefined,
        brief: undefined,
        briefIncomplete: false,
      },
    ]);
    const draft = drafts[0];
    if (draft === undefined) {
      throw new Error("Expected a prompt-only draft.");
    }
    expect(prismaQuestionData("opp-2", draft, 0)).toMatchObject({
      importance: null,
      competency: null,
      brief: undefined,
    });
    expect(interviewQuestionFromDraft(draft, 0)).toMatchObject({
      id: "draft-0",
      prompt: "Only the prompt",
    });
  });

  it("skips blank prompts", () => {
    const formData = new FormData();
    formData.append("prompt", "   ");
    formData.append("importance", "core");
    formData.append("competency", "Ownership");
    formData.append("primaryDimension", "specificity");
    expect(draftsFromFormData(formData)).toEqual([]);
  });

  it("does not invent a brief for a prompt-only row", () => {
    const formData = new FormData();
    formData.append("prompt", "New question?");
    formData.append("importance", "core");
    formData.append("competency", "Ownership");
    formData.append("primaryDimension", "specificity");
    const drafts = draftsFromFormData(formData);
    const draft = drafts[0];
    expect(draft?.brief).toBeUndefined();
    expect(draft?.briefIncomplete).toBe(false);
    expect(draft?.importance).toBe("core");
  });
});
