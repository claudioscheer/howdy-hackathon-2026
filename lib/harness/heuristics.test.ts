import { describe, expect, it } from "vitest";
import {
  CONCRETE_MOVE_ON,
  decideStub,
  hasConcreteEvidence,
  isFundamentalsGap,
  isOffTopic,
  isRecencyMismatch,
  isVagueSpecificity,
  matchHeuristic,
} from "./heuristics";
import { type EvaluationInput } from "./schema";

function input(
  answer: string,
  question = "Tell me about a recent project.",
): EvaluationInput {
  return {
    role: "Engineer",
    seniority: "Senior",
    targetTechStack: ["TypeScript"],
    question,
    answer,
  };
}

describe("hasConcreteEvidence", () => {
  it("treats digits as evidence", () => {
    expect(hasConcreteEvidence("p99 dropped to 38ms")).toBe(true);
    expect(hasConcreteEvidence("I shipped the billing service")).toBe(false);
  });
});

describe("isVagueSpecificity", () => {
  it("matches generic claim phrases even when digits are present", () => {
    expect(
      isVagueSpecificity("I always communicate well with 12 stakeholders"),
    ).toBe(true);
  });

  it("matches soft-skill language without evidence", () => {
    expect(
      isVagueSpecificity("I am passionate about collaboration on every team"),
    ).toBe(true);
  });

  it("does not flag a metric-backed answer without generic claims", () => {
    expect(
      isVagueSpecificity("We cut p99 from 800ms to 80ms with pooling."),
    ).toBe(false);
  });
});

describe("isRecencyMismatch", () => {
  it("matches old years, first-company stories, and legacy stacks", () => {
    expect(isRecencyMismatch("Back in 2018 I owned the portal.")).toBe(true);
    expect(
      isRecencyMismatch(
        "Years ago at my first company I shipped the homepage.",
      ),
    ).toBe(true);
    expect(isRecencyMismatch("We deployed via FTP to Apache.")).toBe(true);
  });

  it("does not treat 2025 as stale", () => {
    expect(isRecencyMismatch("In Q3 2025 we cut checkout latency.")).toBe(
      false,
    );
  });
});

describe("isOffTopic", () => {
  it("is false for a non-technical question", () => {
    expect(
      isOffTopic("Tell me about yourself.", "I love agile standups and Jira."),
    ).toBe(false);
  });

  it("is false when the answer still talks about the technical topic", () => {
    expect(
      isOffTopic(
        "How would you design a database schema for billing?",
        "I would partition the billing schema and add tenant indexes.",
      ),
    ).toBe(false);
  });

  it("is true when a technical question gets process talk", () => {
    expect(
      isOffTopic(
        "How would you partition a Kafka topic for tenant isolation?",
        "Our sprint rituals keep the team honest and Jira stays green.",
      ),
    ).toBe(true);
  });
});

describe("isFundamentalsGap", () => {
  it("requires both senior voice and a weak query habit", () => {
    expect(
      isFundamentalsGap("As a principal architect I don't use indexes."),
    ).toBe(true);
    expect(isFundamentalsGap("As a principal architect I use indexes.")).toBe(
      false,
    );
    expect(isFundamentalsGap("I don't use indexes on a side project.")).toBe(
      false,
    );
  });
});

describe("matchHeuristic", () => {
  it("prefers specificity over recency when both could apply", () => {
    const decision = matchHeuristic(
      input("I always communicate well back in 2018."),
    );
    expect(decision?.dimension).toBe("specificity");
  });

  it("returns null when no heuristic hits", () => {
    expect(
      matchHeuristic(
        input("We cut p99 from 800ms to 80ms with connection pooling."),
      ),
    ).toBeNull();
  });

  it("classifies recency, structure, and fundamentals", () => {
    expect(
      matchHeuristic(input("Back at my first job I owned PHP."))?.dimension,
    ).toBe("relevance");
    expect(
      matchHeuristic(
        input(
          "Our sprint rituals keep the team honest and Jira stays green.",
          "How would you partition a Kafka topic for tenant isolation?",
        ),
      )?.dimension,
    ).toBe("structure");
    expect(
      matchHeuristic(input("As a staff engineer I just do SELECT *."))
        ?.dimension,
    ).toBe("fundamentals");
  });
});

describe("decideStub", () => {
  it("falls back to MOVE_ON", () => {
    expect(
      decideStub(
        input("We cut p99 from 800ms to 80ms with connection pooling."),
      ),
    ).toEqual(CONCRETE_MOVE_ON);
  });
});
