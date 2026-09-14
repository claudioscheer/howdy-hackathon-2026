import { describe, expect, it } from "vitest";
import type { InterviewerBrief } from "./brief";
import type { TranscriptTurn } from "./contracts";
import { answersQuestion } from "./relevance";

const conflictPrompt =
  "Tell me about a time you worked through a difficult technical disagreement with a teammate.";

const apiPrompt =
  "Describe an API design decision you made and the tradeoffs you considered.";

const conflictBrief: InterviewerBrief = {
  competency: "Conflict resolution",
  roleRelevance: "Seniors resolve technical disagreements.",
  importance: "core",
  expectedDepth: "A disagreement, the options, and the decision.",
  evidenceToListenFor: ["disagreement", "options compared", "decision"],
  followUpTriggers: ["no conflict", "no decision"],
  timeBudgetMinutes: 8,
  answerBudget: 3,
  maxFollowUps: 2,
  stopWhen: ["a decision is described"],
};

describe("question relevance", () => {
  it("rejects a fluent React answer to a disagreement question", () => {
    expect(
      answersQuestion(
        conflictPrompt,
        "I used React for six months on a personal project",
      ),
    ).toBe(false);
  });

  it("rejects a React answer that only shares teammate with the question", () => {
    expect(
      answersQuestion(
        conflictPrompt,
        "I used React with a teammate for six months on a personal project.",
      ),
    ).toBe(false);
  });

  it("accepts a paraphrased conflict answer that never repeats the prompt", () => {
    expect(
      answersQuestion(
        conflictPrompt,
        "A colleague proposed a rewrite. I compared alternatives and we agreed on a smaller change.",
      ),
    ).toBe(true);
  });

  it("uses the original question and brief when judging a follow-up answer", () => {
    expect(
      answersQuestion(
        "How does that relate to the situation in the question?",
        "A colleague proposed a rewrite. I compared alternatives and we chose the smaller change.",
        {
          brief: conflictBrief,
          history: [
            {
              id: "t1",
              questionId: "q1",
              speaker: "interviewer",
              kind: "question",
              content: conflictPrompt,
            },
            {
              id: "t2",
              questionId: "q1",
              speaker: "candidate",
              kind: "answer",
              content: "I used React for six months on a personal project",
            },
          ],
        },
      ),
    ).toBe(true);
    expect(
      answersQuestion(
        "How does that relate to the situation in the question?",
        "We used hooks and context on that personal React project.",
        {
          brief: conflictBrief,
          history: [
            {
              id: "t1",
              questionId: "q1",
              speaker: "interviewer",
              kind: "question",
              content: conflictPrompt,
            },
          ],
        },
      ),
    ).toBe(false);
  });

  it("judges a later question against its own topic, not earlier questions", () => {
    const history: TranscriptTurn[] = [
      {
        id: "t1",
        questionId: "q1",
        speaker: "interviewer",
        kind: "question",
        content: conflictPrompt,
      },
      {
        id: "t2",
        questionId: "q1",
        speaker: "candidate",
        kind: "answer",
        content: "My teammate and I disagreed and I measured both designs.",
      },
      {
        id: "t3",
        questionId: "q2",
        speaker: "interviewer",
        kind: "question",
        content: apiPrompt,
      },
    ];
    const apiAnswer =
      "I designed an idempotent endpoint and we cut duplicate orders.";
    const conflictStory =
      "A coworker objected to my plan and we debated it all afternoon.";

    expect(answersQuestion(apiPrompt, apiAnswer, { history })).toBe(true);
    expect(answersQuestion(apiPrompt, conflictStory, { history })).toBe(false);
    expect(
      answersQuestion(apiPrompt, apiAnswer, { history, questionId: "q2" }),
    ).toBe(true);
    expect(
      answersQuestion(apiPrompt, conflictStory, { history, questionId: "q2" }),
    ).toBe(false);
  });

  it("uses the named question's prompt when judging its follow-up answer", () => {
    const history: TranscriptTurn[] = [
      {
        id: "t1",
        questionId: "q1",
        speaker: "interviewer",
        kind: "question",
        content: conflictPrompt,
      },
      {
        id: "t2",
        questionId: "q2",
        speaker: "interviewer",
        kind: "question",
        content: apiPrompt,
      },
    ];
    const followUpPrompt =
      "How does that relate to the situation in the question?";

    expect(
      answersQuestion(followUpPrompt, "We debated a rewrite for weeks.", {
        history,
        questionId: "q1",
      }),
    ).toBe(true);
    expect(
      answersQuestion(followUpPrompt, "We debated a rewrite for weeks.", {
        history,
      }),
    ).toBe(false);
  });

  it("attaches the API design family to a prompt that says API", () => {
    expect(
      answersQuestion(apiPrompt, "We versioned the payload schema carefully."),
    ).toBe(true);
    expect(
      answersQuestion(apiPrompt, "Our API had tradeoffs we considered."),
    ).toBe(true);
    expect(
      answersQuestion(
        apiPrompt,
        "I made a decision and considered tradeoffs with my manager.",
      ),
    ).toBe(false);
  });

  it("keeps short words out of the shared-token fallback", () => {
    expect(
      answersQuestion(
        "Walk through your recent ownership of the SDK.",
        "The SDK was recent.",
      ),
    ).toBe(false);
  });

  it("treats a prompt with no content tokens as already addressed", () => {
    expect(answersQuestion("Tell me.", "Anything the candidate types.")).toBe(
      true,
    );
  });

  it("accepts an on-topic disagreement answer even without metrics", () => {
    expect(
      answersQuestion(
        conflictPrompt,
        "I had a disagreement with a teammate and we eventually aligned.",
      ),
    ).toBe(true);
  });

  it("requires two shared tokens when no topic family or brief is present", () => {
    expect(
      answersQuestion(
        "Walk through your recent ownership example.",
        "I described recent ownership clearly.",
      ),
    ).toBe(true);
    expect(
      answersQuestion(
        "Walk through your recent ownership example.",
        "I like working on personal photos.",
      ),
    ).toBe(false);
  });

  it("rejects a briefed answer that misses the evidence to listen for", () => {
    expect(
      answersQuestion(
        "Walk me through your recent ownership.",
        "I shipped it.",
        {
          brief: {
            competency: "Ownership",
            roleRelevance: "Seniors own delivery.",
            importance: "core",
            expectedDepth: "A recent owned example.",
            evidenceToListenFor: ["rollback"],
            followUpTriggers: ["no ownership"],
            timeBudgetMinutes: 8,
            answerBudget: 3,
            maxFollowUps: 2,
            stopWhen: ["ownership is present"],
          },
        },
      ),
    ).toBe(false);
  });

  it("matches brief evidence when the prompt has no topic family", () => {
    expect(
      answersQuestion(
        "Walk me through your recent ownership.",
        "I owned the rollback after the cache incident.",
        {
          brief: {
            ...conflictBrief,
            competency: "Ownership",
            evidenceToListenFor: ["owned the rollback"],
            followUpTriggers: ["no ownership"],
          },
        },
      ),
    ).toBe(true);
  });
});
