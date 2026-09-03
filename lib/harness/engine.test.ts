import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DeterministicStubProvider,
  InterviewEngine,
} from "@/lib/harness/engine";
import { type QuestionState } from "@/lib/harness/schema";

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
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
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

const idleState: QuestionState = {
  questionId: "q1",
  followUpCount: 0,
  isComplete: false,
};

function input(answer: string, question = "Tell me about a recent project.") {
  return {
    role: "Engineer",
    seniority: "Senior",
    targetTechStack: ["TypeScript"],
    question,
    answer,
  };
}

describe("DeterministicStubProvider", () => {
  it("ignores stubs that do not appear in the answer", async () => {
    const provider = new DeterministicStubProvider();
    provider.registerStub("zzz-no-match", {
      decision: "FOLLOW_UP",
      reason: "Should not match this answer at all.",
      dimension: "specificity",
      followUp: "Unused.",
    });
    const engine = new InterviewEngine(provider);
    const result = await engine.evaluateTurn(
      input("We cut p99 from 800ms to 80ms with pooling."),
      idleState,
    );
    expect(result.decision.decision).toBe("MOVE_ON");
  });

  it("uses a registered stub before heuristics", async () => {
    const provider = new DeterministicStubProvider();
    provider.registerStub("custom marker phrase", {
      decision: "FOLLOW_UP",
      reason: "Registered stub matched the answer text.",
      dimension: "specificity",
      followUp: "Give one concrete example.",
    });
    const engine = new InterviewEngine(provider);
    const result = await engine.evaluateTurn(
      input("This uses a custom marker phrase on purpose."),
      idleState,
    );
    expect(result.decision.decision).toBe("FOLLOW_UP");
    expect(result.decision.reason).toMatch(/registered stub/i);
  });

  it("follows up on generic hard-work claims", async () => {
    const engine = new InterviewEngine(new DeterministicStubProvider());
    const result = await engine.evaluateTurn(
      input("I work hard and deliver results every sprint."),
      idleState,
    );
    expect(result.decision.dimension).toBe("specificity");
  });

  it("follows up on first-job stories", async () => {
    const engine = new InterviewEngine(new DeterministicStubProvider());
    const result = await engine.evaluateTurn(
      input("Back at my first job I owned the whole stack."),
      idleState,
    );
    expect(result.decision.dimension).toBe("relevance");
  });

  it("follows up on dated PHP stacks", async () => {
    const engine = new InterviewEngine(new DeterministicStubProvider());
    const result = await engine.evaluateTurn(
      input("We shipped everything on jquery and php 5."),
      idleState,
    );
    expect(result.decision.dimension).toBe("relevance");
  });

  it("follows up when senior voice meets missing indexes", async () => {
    const engine = new InterviewEngine(new DeterministicStubProvider());
    const result = await engine.evaluateTurn(
      input("As a senior full-stack I don't use indexes."),
      idleState,
    );
    expect(result.decision.dimension).toBe("fundamentals");
  });
});

describe("InterviewEngine", () => {
  it("throws when the provider returns invalid JSON", async () => {
    const provider = {
      evaluate: async () => ({ decision: "FOLLOW_UP" }),
    };
    const engine = new InterviewEngine(provider);
    await expect(
      engine.evaluateTurn(input("anything"), idleState),
    ).rejects.toThrow(/Layer 0 Contract Violation/);
  });
});
