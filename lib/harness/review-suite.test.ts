import { describe, expect, it } from "vitest";
import { type EvalFixture, EvalFixtureSchema } from "./fixtures";
import {
  answerSimilarityFailure,
  canaryFlagFailures,
  dimensionCoverageFailures,
  duplicateIdFailures,
  independenceFailures,
  reviewEvalSuite,
} from "./review-suite";

function fixture(
  id: string,
  answer: string,
  expected: EvalFixture["expected"],
  stubMustMiss?: boolean,
): EvalFixture {
  return EvalFixtureSchema.parse({
    id,
    description: `Fixture ${id}`,
    input: {
      role: "Engineer",
      seniority: "Senior",
      targetTechStack: ["Go"],
      question: "Describe a distributed systems challenge.",
      answer,
    },
    expected,
    stubMustMiss,
  });
}

describe("duplicateIdFailures", () => {
  it("flags the same id across suites", () => {
    const one = fixture("dup", "unique answer alpha", { decision: "MOVE_ON" });
    expect(duplicateIdFailures([[one], [one]])).toHaveLength(1);
    expect(duplicateIdFailures([[one], []])).toEqual([]);
  });
});

describe("answerSimilarityFailure", () => {
  it("detects containment in both directions and high jaccard", () => {
    const short = fixture("short", "alpha beta gamma delta", {
      decision: "MOVE_ON",
    });
    const long = fixture("long", "alpha beta gamma delta extra tokens here", {
      decision: "MOVE_ON",
    });
    expect(answerSimilarityFailure(short, long, 0.4)).toMatch(/contains/);
    expect(answerSimilarityFailure(long, short, 0.4)).toMatch(/contains/);
    const close = fixture("close", "alpha beta gamma epsilon", {
      decision: "MOVE_ON",
    });
    expect(answerSimilarityFailure(short, close, 0.2)).toMatch(/too similar/);
    expect(answerSimilarityFailure(short, close, 0.99)).toBeNull();
  });
});

describe("independenceFailures", () => {
  it("labels candidate failures", () => {
    const golden = fixture("g1", "alpha beta gamma delta", {
      decision: "MOVE_ON",
    });
    const holdout = fixture("h1", "alpha beta gamma delta copied", {
      decision: "FOLLOW_UP",
      dimension: "specificity",
    });
    expect(
      independenceFailures([golden], [holdout], "Holdout").length,
    ).toBeGreaterThan(0);
  });
});

describe("dimensionCoverageFailures", () => {
  it("requires every rubric dimension plus MOVE_ON and a cap", () => {
    const onlySpecificity = [
      fixture("s", "vague answer text here", {
        decision: "FOLLOW_UP",
        dimension: "specificity",
      }),
    ];
    const failures = dimensionCoverageFailures(onlySpecificity);
    expect(failures.join(" ")).toMatch(/relevance/);
    expect(failures.join(" ")).toMatch(/MOVE_ON/);
    expect(failures.join(" ")).toMatch(/cap/);
  });
});

describe("canaryFlagFailures", () => {
  it("requires canaries and stubMustMiss only on canaries", () => {
    const golden = fixture("g", "golden answer text here", {
      decision: "MOVE_ON",
    });
    const flagged = fixture(
      "g2",
      "another golden answer text",
      { decision: "MOVE_ON" },
      true,
    );
    expect(canaryFlagFailures([golden], [], []).join(" ")).toMatch(
      /at least one canary/,
    );
    expect(canaryFlagFailures([flagged], [], [golden])).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/not a canary/),
        expect.stringMatching(/must set stubMustMiss/),
      ]),
    );
  });
});

describe("reviewEvalSuite", () => {
  it("returns no findings for a balanced independent suite", () => {
    const goldens = [
      fixture("g-spec", "always communicate well with nobody", {
        decision: "FOLLOW_UP",
        dimension: "specificity",
      }),
      fixture("g-rel", "back in 2018 at a forgotten employer", {
        decision: "FOLLOW_UP",
        dimension: "relevance",
      }),
      fixture("g-fun", "principal architect who hates indexes entirely", {
        decision: "FOLLOW_UP",
        dimension: "fundamentals",
      }),
      fixture("g-str", "agile standups instead of the schema question", {
        decision: "FOLLOW_UP",
        dimension: "structure",
      }),
      fixture("g-move", "cut p99 from 800ms to 80ms with pooling", {
        decision: "MOVE_ON",
      }),
      fixture("g-cap", "work hard and deliver results again", {
        finalDecision: "MOVE_ON",
        isCapped: true,
      }),
    ];
    const holdouts = [
      fixture("h-spec", "folks say i keep clients happy forever", {
        decision: "FOLLOW_UP",
        dimension: "specificity",
      }),
    ];
    const canaries = [
      fixture(
        "c1",
        "handled the usual stuff and it went fine",
        { decision: "FOLLOW_UP", dimension: "specificity" },
        true,
      ),
    ];
    expect(reviewEvalSuite({ goldens, holdouts, canaries })).toEqual([]);
  });
});
