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

describe("Layer 1: Golden Transcripts & Holdouts Eval Suite", () => {
  const provider = new DeterministicStubProvider();
  const engine = new InterviewEngine(provider);

  const goldensDir = path.resolve(import.meta.dirname, "../../evals/goldens");
  const holdoutsDir = path.resolve(import.meta.dirname, "../../evals/holdouts");

  function loadFixturesFromDir(dir: string): GoldenFixture[] {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  }

  const goldenFixtures = loadFixturesFromDir(goldensDir);
  const holdoutFixtures = loadFixturesFromDir(holdoutsDir);

  describe("Golden Fixtures (Frozen Invariants)", () => {
    expect(goldenFixtures.length).toBeGreaterThanOrEqual(6);

    goldenFixtures.forEach((fixture) => {
      it(`evaluates fixture [${fixture.id}]: ${fixture.description}`, async () => {
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
  });

  describe("Holdout Fixtures (Anti-Overfitting Protection)", () => {
    expect(holdoutFixtures.length).toBeGreaterThanOrEqual(1);

    holdoutFixtures.forEach((fixture) => {
      it(`evaluates holdout [${fixture.id}]: ${fixture.description}`, async () => {
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
});
