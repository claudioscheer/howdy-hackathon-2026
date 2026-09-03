import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultQuestionState,
  EvalFixtureSchema,
  fixtureState,
  loadFixtureFile,
  loadFixturesFromDir,
  matchesExpected,
  matchesProductExpected,
  type EvalFixture,
} from "./fixtures";

function sampleFixture(
  overrides: Partial<EvalFixture> & { id?: string } = {},
): EvalFixture {
  return EvalFixtureSchema.parse({
    id: "sample",
    description: "A valid fixture used in unit tests.",
    input: {
      opportunity: {
        id: "fictional-role",
        role: "Engineer",
        seniority: "Senior",
        targetTechStack: ["TypeScript"],
        interviewType: "technical",
      },
      question: {
        id: "q1",
        prompt: "Tell me about a recent project.",
        primaryDimension: "specificity",
      },
      answer: "We cut p99 from 800ms to 80ms.",
      history: [],
    },
    expected: { decision: "MOVE_ON" },
    ...overrides,
  });
}

describe("fixture state", () => {
  it("defaults follow-up count to zero", () => {
    expect(defaultQuestionState("q1")).toEqual({
      questionId: "q1",
      followUpCount: 0,
      isComplete: false,
    });
  });

  it("uses the fixture state when present", () => {
    const fixture = sampleFixture({
      state: { questionId: "q9", followUpCount: 2, isComplete: false },
    });
    expect(fixtureState(fixture).followUpCount).toBe(2);
    expect(fixtureState(sampleFixture()).questionId).toBe("sample");
  });
});

describe("EvalFixtureSchema", () => {
  it("rejects fixtures with neither decision nor finalDecision", () => {
    const parsed = EvalFixtureSchema.safeParse({
      id: "bad",
      description: "Missing expected fields.",
      input: sampleFixture().input,
      expected: {},
    });
    expect(parsed.success).toBe(false);
  });
});

describe("loadFixturesFromDir", () => {
  it("returns an empty list when the directory does not exist", () => {
    expect(
      loadFixturesFromDir(path.join(os.tmpdir(), "missing-evals")),
    ).toEqual([]);
  });

  it("loads valid files and rejects invalid ones", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fixtures-"));
    fs.writeFileSync(
      path.join(dir, "ok.json"),
      JSON.stringify(sampleFixture({ id: "ok" })),
    );
    fs.writeFileSync(path.join(dir, "skip.txt"), "nope");
    expect(loadFixturesFromDir(dir)).toHaveLength(1);
    fs.writeFileSync(path.join(dir, "bad.json"), JSON.stringify({ id: "bad" }));
    expect(() => loadFixturesFromDir(dir)).toThrow(/Invalid fixture/);
    fs.writeFileSync(path.join(dir, "not-json.json"), "{");
    expect(() => loadFixtureFile(path.join(dir, "not-json.json"))).toThrow();
  });
});

describe("matchesExpected", () => {
  const pass = {
    decision: {
      decision: "FOLLOW_UP" as const,
      dimension: "specificity" as const,
      reason: "The answer needs a more concrete example.",
      followUp: "What did you personally change?",
    },
    finalDecision: "MOVE_ON" as const,
    isCapped: true,
  };

  it("checks each expected field", () => {
    expect(matchesProductExpected({ decision: "MOVE_ON" }, pass)).toBe(false);
    expect(
      matchesProductExpected(
        { decision: "FOLLOW_UP", dimension: "relevance" },
        pass,
      ),
    ).toBe(false);
    expect(matchesProductExpected({ finalDecision: "FOLLOW_UP" }, pass)).toBe(
      false,
    );
    expect(matchesProductExpected({ isCapped: false }, pass)).toBe(false);
    expect(
      matchesProductExpected(
        {
          decision: "FOLLOW_UP",
          dimension: "specificity",
          finalDecision: "MOVE_ON",
          isCapped: true,
        },
        pass,
      ),
    ).toBe(true);
  });

  it("never treats an incorrect product decision as success", () => {
    const fixture = sampleFixture({
      expected: { decision: "FOLLOW_UP", dimension: "specificity" },
    });
    expect(matchesExpected(fixture, pass)).toBe(true);
    expect(
      matchesExpected(fixture, {
        decision: {
          decision: "MOVE_ON",
          reason: "The mutation moved on incorrectly.",
        },
        finalDecision: "MOVE_ON",
        isCapped: false,
      }),
    ).toBe(false);
  });
});
