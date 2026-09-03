import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DeterministicStubProvider,
  InterviewEngine,
} from "@/lib/harness/engine";
import { QuestionState } from "@/lib/harness/schema";

interface GoldenFixture {
  id: string;
  description: string;
  input: {
    role: string;
    seniority: string;
    targetTechStack: string[];
    question: string;
    answer: string;
  };
  state?: QuestionState;
  expected: {
    decision?: "FOLLOW_UP" | "MOVE_ON";
    dimension?: string;
    finalDecision?: "FOLLOW_UP" | "MOVE_ON";
    isCapped?: boolean;
  };
}

function loadFixtures(dir: string): GoldenFixture[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))
    );
}

describe("golden and holdout fixtures", () => {
  const provider = new DeterministicStubProvider();
  const engine = new InterviewEngine(provider);
  const goldensDir = path.resolve(import.meta.dirname, "../../evals/goldens");
  const holdoutsDir = path.resolve(import.meta.dirname, "../../evals/holdouts");
  const goldens = loadFixtures(goldensDir);
  const holdouts = loadFixtures(holdoutsDir);

  it("has at least six goldens and one holdout", () => {
    expect(goldens.length).toBeGreaterThanOrEqual(6);
    expect(holdouts.length).toBeGreaterThanOrEqual(1);
  });

  goldens.forEach((fixture) => {
    it(`golden [${fixture.id}]: ${fixture.description}`, async () => {
      const state: QuestionState = fixture.state ?? {
        questionId: fixture.id,
        followUpCount: 0,
        isComplete: false,
      };
      const result = await engine.evaluateTurn(fixture.input, state);
      if (fixture.expected.decision) {
        expect(result.decision.decision).toBe(fixture.expected.decision);
      }
      if (fixture.expected.dimension) {
        expect(result.decision.dimension).toBe(fixture.expected.dimension);
      }
      if (fixture.expected.finalDecision) {
        expect(result.finalDecision).toBe(fixture.expected.finalDecision);
      }
      if (fixture.expected.isCapped !== undefined) {
        expect(result.isCapped).toBe(fixture.expected.isCapped);
      }
    });
  });

  holdouts.forEach((fixture) => {
    it(`holdout [${fixture.id}]: ${fixture.description}`, async () => {
      const state: QuestionState = fixture.state ?? {
        questionId: fixture.id,
        followUpCount: 0,
        isComplete: false,
      };
      const result = await engine.evaluateTurn(fixture.input, state);
      if (fixture.expected.decision) {
        expect(result.decision.decision).toBe(fixture.expected.decision);
      }
      if (fixture.expected.dimension) {
        expect(result.decision.dimension).toBe(fixture.expected.dimension);
      }
    });
  });
});
