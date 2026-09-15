import { describe, expect, it, vi } from "vitest";
import { ScriptedAnswerEvaluator } from "./evaluator";
import { OpenCodeAnswerEvaluator } from "./evaluator-opencode";
import {
  createPracticeAnswerEvaluator,
  createPracticeQuestionSpeaker,
  createPracticeReportEvaluator,
  openCodeKeyPresent,
  livePracticeEvaluatorEnabled,
  livePracticeReportEnabled,
} from "./practice-evaluators";
import { PlannedQuestionSpeaker } from "./interviewer-ask";
import { OpenCodeReportEvaluator } from "./report-evaluator-opencode";
import { ScriptedReportEvaluator } from "./report-evaluator";

const FakeOpenCodeAnswerEvaluator = vi.hoisted(
  () => class FakeOpenCodeAnswerEvaluator {},
);

const FakeOpenCodeQuestionSpeaker = vi.hoisted(
  () => class FakeOpenCodeQuestionSpeaker {},
);

const FakeOpenCodeReportEvaluator = vi.hoisted(
  () => class FakeOpenCodeReportEvaluator {},
);

vi.mock("./evaluator-opencode", () => ({
  OpenCodeAnswerEvaluator: FakeOpenCodeAnswerEvaluator,
  createOpenCodeAnswerEvaluator: () => new FakeOpenCodeAnswerEvaluator(),
}));

vi.mock("./interviewer-ask-opencode", () => ({
  createOpenCodeQuestionSpeaker: () => new FakeOpenCodeQuestionSpeaker(),
}));

vi.mock("./report-evaluator-opencode", () => ({
  OpenCodeReportEvaluator: FakeOpenCodeReportEvaluator,
  createOpenCodeReportEvaluator: () => new FakeOpenCodeReportEvaluator(),
}));

describe("practice evaluators", () => {
  it("defaults to scripted adapters so verify stays keyless", () => {
    expect(openCodeKeyPresent({})).toBe(false);
    expect(openCodeKeyPresent({ OPENCODE_API_KEY: "" })).toBe(false);
    expect(
      createPracticeAnswerEvaluator({ OPENCODE_API_KEY: "" }),
    ).toBeInstanceOf(ScriptedAnswerEvaluator);
    expect(typeof livePracticeReportEnabled()).toBe("boolean");
    expect(typeof createPracticeReportEvaluator()).toBe("object");
    expect(livePracticeReportEnabled({})).toBe(false);
    expect(
      createPracticeReportEvaluator({ OPENCODE_API_KEY: "" }),
    ).toBeInstanceOf(ScriptedReportEvaluator);
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
    expect(
      createPracticeReportEvaluator({ OPENCODE_API_KEY: "demo-key" }),
    ).toBeInstanceOf(OpenCodeReportEvaluator);
    expect(
      livePracticeReportEnabled({
        OPENCODE_API_KEY: "demo-key",
        PRACTICE_LIVE_EVALUATOR: "0",
      }),
    ).toBe(false);
    expect(
      createPracticeReportEvaluator({
        OPENCODE_API_KEY: "demo-key",
        PRACTICE_LIVE_EVALUATOR: "0",
      }),
    ).toBeInstanceOf(ScriptedReportEvaluator);
  });

  it("keeps scripted answers and follow-ups when mock is true", () => {
    const liveEnv = { OPENCODE_API_KEY: "demo-key" };
    expect(livePracticeEvaluatorEnabled(liveEnv, true)).toBe(false);
    expect(createPracticeAnswerEvaluator(liveEnv, true)).toBeInstanceOf(
      ScriptedAnswerEvaluator,
    );
    expect(createPracticeQuestionSpeaker(liveEnv, true)).toBeInstanceOf(
      PlannedQuestionSpeaker,
    );
    expect(livePracticeReportEnabled(liveEnv)).toBe(true);
    expect(createPracticeReportEvaluator(liveEnv)).toBeInstanceOf(
      OpenCodeReportEvaluator,
    );
  });
});
