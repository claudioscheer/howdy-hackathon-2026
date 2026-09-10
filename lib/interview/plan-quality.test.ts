import { describe, expect, it } from "vitest";
import type { InterviewerBrief } from "./brief";
import { DEFAULT_TARGET_MINUTES } from "./contracts";
import {
  briefedPlanProblems,
  questionTimeBudget,
  savedPlanProblems,
} from "./plan-quality";

function brief(
  importance: InterviewerBrief["importance"],
  prompt: string,
  timeBudgetMinutes = 8,
  competency = prompt,
): {
  id: string;
  prompt: string;
  primaryDimension: "specificity";
  brief: InterviewerBrief;
} {
  return {
    id: prompt,
    prompt,
    primaryDimension: "specificity",
    brief: {
      competency,
      roleRelevance: "Needed for the role.",
      importance,
      expectedDepth: "A concrete owned example.",
      evidenceToListenFor: ["owned action"],
      followUpTriggers: ["missing ownership"],
      timeBudgetMinutes,
      answerBudget: 3,
      maxFollowUps: 2,
      stopWhen: ["ownership is present"],
    },
  };
}

describe("briefed plan quality", () => {
  it("allows a variable question count that still has a core and fits near 40 minutes", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "What have you focused on recently?", 8),
            brief("core", "Walk through a production incident.", 12),
            brief("supporting", "How did you work through disagreement?", 8),
          ],
        },
        "technical",
      ),
    ).toEqual([]);
  });

  it("requires one system-design core without a fixed question count", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [brief("core", "Design a multi-region API.", 25)],
        },
        "system_design",
      ),
    ).toEqual([]);
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "First scenario?", 15),
            brief("core", "Second scenario?", 15),
          ],
        },
        "system_design",
      ),
    ).toEqual([
      "A system-design plan must have exactly one core scenario so inner probes share one follow-up cap.",
    ]);
  });

  it("rejects duplicate prompts, short agendas, and over-budget agendas", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: 20,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "Same question?"),
            brief("core", "Same question?"),
          ],
        },
        "technical",
      ),
    ).toContain("The plan repeats a question prompt.");
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [brief("core", "Only one short question?", 8)],
        },
        "technical",
      ),
    ).toContain("The plan is too short for a close-to-40-minute interview.");
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "First?", 20),
            brief("core", "Second?", 20),
          ],
        },
        "technical",
      ),
    ).toContain("Question time budgets do not fit the agenda envelope.");
  });

  it("rejects too many shallow questions and missing cores", () => {
    const questions = ["A?", "B?", "C?", "D?", "E?", "F?", "G?"].map((prompt) =>
      brief("core", prompt, 5),
    );
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions,
        },
        "behavioral",
      ),
    ).toContain(
      "The plan has more questions than a close-to-40-minute interview can hold.",
    );
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("supporting", "A?", 12),
            brief("supporting", "B?", 12),
            brief("optional", "C?", 8),
          ],
        },
        "behavioral",
      ),
    ).toEqual(["The plan needs at least two core questions."]);
  });

  it("rejects a single-core technical plan and duplicate competencies", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "Only one core?", 12),
            brief("supporting", "Collaboration?", 12),
            brief("optional", "Nice to have?", 8),
          ],
        },
        "technical",
      ),
    ).toContain("The plan needs at least two core questions.");
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "First ownership question?", 12, "Ownership"),
            brief("core", "Second ownership question?", 12, "Ownership"),
            brief("supporting", "Collaboration?", 8),
          ],
        },
        "technical",
      ),
    ).toContain("The plan repeats a competency.");
  });

  it("allows prompt-only plans and rejects mixed incomplete briefs", () => {
    expect(
      savedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            {
              id: "q1",
              prompt: "First?",
              primaryDimension: "specificity",
            },
            {
              id: "q2",
              prompt: "Second?",
              primaryDimension: "fundamentals",
            },
          ],
        },
        "behavioral",
      ),
    ).toEqual([]);
    expect(
      savedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "First?", 12),
            {
              id: "q2",
              prompt: "Second?",
              primaryDimension: "fundamentals",
            },
          ],
        },
        "behavioral",
      ),
    ).toEqual([
      "Briefed evaluation requires a complete interviewer brief on every question.",
    ]);
  });

  it("ignores blank competency strings when checking duplicates", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            {
              ...brief("core", "First?", 12, "Ownership"),
              brief: {
                ...brief("core", "First?", 12, "Ownership").brief,
                competency: "   ",
              },
            },
            brief("core", "Second?", 12, "API design"),
            brief("supporting", "Third?", 8, "Collaboration"),
          ],
        },
        "technical",
      ),
    ).toEqual([]);
  });

  it("counts missing briefs as zero minutes", () => {
    expect(
      questionTimeBudget({
        id: "q1",
        prompt: "Prompt only.",
        primaryDimension: "specificity",
      }),
    ).toBe(0);
  });

  it("refuses briefed evaluation when any interviewer brief is missing", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            {
              id: "q1",
              prompt: "Prompt only.",
              primaryDimension: "specificity",
            },
          ],
        },
        "behavioral",
      ),
    ).toEqual([
      "Briefed evaluation requires a complete interviewer brief on every question.",
    ]);
  });

  it("rejects question slices that are too short or a target far from 40 minutes", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: 50,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "First?", 12),
            brief("core", "Second?", 12),
            brief("supporting", "Third?", 8),
          ],
        },
        "technical",
      ),
    ).toContain("The plan must target close to 40 minutes.");
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [
            brief("core", "Tiny slice?", 4),
            brief("core", "Longer topic?", 20),
            brief("supporting", "Collaboration?", 8),
          ],
        },
        "technical",
      ),
    ).toContain("Each question needs a time budget that fits a live turn.");
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 10,
          questions: [brief("core", "Whole interview in one prompt?", 26)],
        },
        "system_design",
      ),
    ).toContain("Each question needs a time budget that fits a live turn.");
  });

  it("requires an answer opening for every core", () => {
    expect(
      briefedPlanProblems(
        {
          targetMinutes: DEFAULT_TARGET_MINUTES,
          sessionAnswerBudget: 1,
          questions: [
            brief("core", "First core?", 12),
            brief("core", "Second core?", 12),
            brief("supporting", "Collaboration?", 8),
          ],
        },
        "technical",
      ),
    ).toContain("The answer budget cannot reserve an opening for every core.");
  });
});
