import { describe, expect, it } from "vitest";
import { matchingTopicFamilies } from "./relevance-topics";

describe("relevance topic families", () => {
  it("selects conflict and ignores unrelated tokens", () => {
    expect(
      matchingTopicFamilies(new Set(["disagreement", "teammate"])).map(
        (family) => family.id,
      ),
    ).toEqual(["conflict"]);
    expect(matchingTopicFamilies(new Set(["react", "teammate"]))).toEqual([]);
  });
});
