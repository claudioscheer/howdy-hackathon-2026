import { describe, expect, it, vi } from "vitest";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { OpenCodeAnswerEvaluator } from "./evaluator-opencode";
import {
  createPracticeAnswerEvaluator,
  createPracticeQuestionSpeaker,
  createPracticeReportEvaluator,
  openCodeKeyPresent,
  livePracticeEvaluatorEnabled,
} from "./practice-evaluators";
import { PlannedQuestionSpeaker } from "./interviewer-ask";
import { ScriptedReportEvaluator } from "./report-evaluator";

const FakeOpenCodeAnswerEvaluator = vi.hoisted(
  () => class FakeOpenCodeAnswerEvaluator {},
);

const FakeOpenCodeQuestionSpeaker = vi.hoisted(
  () => class FakeOpenCodeQuestionSpeaker {},
);

vi.mock("./evaluator-opencode", () => ({
  OpenCodeAnswerEvaluator: FakeOpenCodeAnswerEvaluator,
  createOpenCodeAnswerEvaluator: () => new FakeOpenCodeAnswerEvaluator(),
}));

vi.mock("./interviewer-ask-opencode", () => ({
  createOpenCodeQuestionSpeaker: () => new FakeOpenCodeQuestionSpeaker(),
}));

describe("practice evaluators", () => {
  it("defaults to scripted adapters so verify stays keyless", () => {
    expect(openCodeKeyPresent({})).toBe(false);
    expect(openCodeKeyPresent({ OPENCODE_API_KEY: "" })).toBe(false);
    expect(
      createPracticeAnswerEvaluator({ OPENCODE_API_KEY: "" }),
    ).toBeInstanceOf(ScriptedAnswerEvaluator);
    expect(createPracticeReportEvaluator()).toBeInstanceOf(
      ScriptedReportEvaluator,
    );
    expect(
      createPracticeQuestionSpeaker({ OPENCODE_API_KEY: "" }),
    ).toBeInstanceOf(PlannedQuestionSpeaker);
  });

  it("uses OpenCode when an API key is present unless verify disables it", () => {
    expect(openCodeKeyPresent({ OPENCODE_API_KEY: "demo-key" })).toBe(true);
    expect(livePracticeEvaluatorEnabled({ OPENCODE_API_KEY: "demo-key" })).toBe(
      true,
    );
    expect(
      createPracticeAnswerEvaluator({ OPENCODE_API_KEY: "demo-key" }),
    ).toBeInstanceOf(OpenCodeAnswerEvaluator);
    expect(
      createPracticeQuestionSpeaker({ OPENCODE_API_KEY: "demo-key" }),
    ).toBeInstanceOf(FakeOpenCodeQuestionSpeaker);
    expect(
      livePracticeEvaluatorEnabled({
        OPENCODE_API_KEY: "demo-key",
        PRACTICE_LIVE_EVALUATOR: "0",
      }),
    ).toBe(false);
    expect(
      createPracticeAnswerEvaluator({
        OPENCODE_API_KEY: "demo-key",
        PRACTICE_LIVE_EVALUATOR: "0",
      }),
    ).toBeInstanceOf(ScriptedAnswerEvaluator);
    expect(
      createPracticeQuestionSpeaker({
        OPENCODE_API_KEY: "demo-key",
        PRACTICE_LIVE_EVALUATOR: "0",
      }),
    ).toBeInstanceOf(PlannedQuestionSpeaker);
  });
});
