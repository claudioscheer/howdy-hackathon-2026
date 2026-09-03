import path from "node:path";
import { describe, expect, it } from "vitest";
import { DeterministicStubProvider, InterviewEngine } from "./engine";
import { fixtureState, loadFixturesFromDir, matchesExpected } from "./fixtures";
import { type QuestionState } from "./schema";

const idleState: QuestionState = {
  questionId: "q1",
  followUpCount: 0,
  isComplete: false,
};

function input(answer: string, question = "Tell me about a recent project.") {
  return {
    opportunity: {
      id: "fictional-role",
      role: "Engineer",
      seniority: "Senior",
      targetTechStack: ["TypeScript"],
      interviewType: "technical" as const,
    },
    question: {
      id: "q1",
      prompt: question,
      primaryDimension: "specificity" as const,
    },
    answer,
    history: [],
  };
}

describe("golden and holdout fixtures", () => {
  const engine = new InterviewEngine(new DeterministicStubProvider());
  const evalsDir = path.resolve(import.meta.dirname, "../../evals");
  const goldens = loadFixturesFromDir(path.join(evalsDir, "goldens"));
  const holdouts = loadFixturesFromDir(path.join(evalsDir, "holdouts"));

  it("has a regression set and independent holdouts", () => {
    expect(goldens.length).toBeGreaterThanOrEqual(7);
    expect(holdouts.length).toBeGreaterThanOrEqual(3);
  });

  for (const fixture of [...goldens, ...holdouts]) {
    it(`fixture [${fixture.id}]: ${fixture.description}`, async () => {
      const result = await engine.evaluateTurn(
        fixture.input,
        fixtureState(fixture),
      );
      expect(matchesExpected(fixture, result)).toBe(true);
    });
  }
});

describe("DeterministicStubProvider", () => {
  it("ignores stubs that do not appear in the answer", async () => {
    const provider = new DeterministicStubProvider();
    provider.registerStub("zzz-no-match", {
      decision: "FOLLOW_UP",
      reason: "Should not match this answer at all.",
      dimension: "specificity",
      followUp: "Unused follow-up question.",
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
});

describe("InterviewEngine", () => {
  it("throws when the provider returns invalid JSON", async () => {
    const engine = new InterviewEngine({
      evaluate: async () => ({ decision: "FOLLOW_UP" }),
    });
    await expect(
      engine.evaluateTurn(input("anything"), idleState),
    ).rejects.toThrow(/Layer 0 Contract Violation/);
  });

  it("does not call the provider for a blank answer", async () => {
    const engine = new InterviewEngine({
      evaluate: async () => {
        throw new Error("provider should not run");
      },
    });
    const result = await engine.evaluateTurn(input("   "), idleState);
    expect(result.decision.decision).toBe("FOLLOW_UP");
    expect(result.decision.dimension).toBe("specificity");
  });

  it("still applies the follow-up cap to a blank answer", async () => {
    const engine = new InterviewEngine({
      evaluate: async () => {
        throw new Error("provider should not run");
      },
    });
    const result = await engine.evaluateTurn(input(""), {
      questionId: "q1",
      followUpCount: 2,
      isComplete: false,
    });
    expect(result.finalDecision).toBe("MOVE_ON");
    expect(result.isCapped).toBe(true);
  });
});
