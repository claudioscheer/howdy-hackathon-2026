import { describe, expect, it } from "vitest";
import { jaccardSimilarity, overlapRatio, significantTokens } from "./tokens";

describe("significantTokens", () => {
  it("drops short tokens and punctuation", () => {
    expect([...significantTokens("I am a good communicator.")].sort()).toEqual([
      "communicator",
      "good",
    ]);
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1 for two empty sets", () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(1);
  });

  it("returns 0 when there is no overlap", () => {
    expect(jaccardSimilarity(new Set(["alpha"]), new Set(["beta"]))).toBe(0);
  });

  it("returns the intersection over union", () => {
    expect(
      jaccardSimilarity(new Set(["alpha", "beta"]), new Set(["beta", "gamma"])),
    ).toBeCloseTo(1 / 3);
  });
});

describe("overlapRatio", () => {
  it("returns 1 when the question has no significant tokens", () => {
    expect(overlapRatio("I a to", "database indexes")).toBe(1);
  });

  it("returns 0 when the answer shares no question tokens", () => {
    expect(
      overlapRatio("design a database schema", "agile standups and rituals"),
    ).toBe(0);
  });

  it("returns the fraction of question tokens found in the answer", () => {
    expect(
      overlapRatio("database schema design", "database schema with tenants"),
    ).toBeCloseTo(2 / 3);
  });
});
