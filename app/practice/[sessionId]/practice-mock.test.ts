import { describe, expect, it } from "vitest";
import { isPracticeMockQuery } from "./practice-mock";

describe("isPracticeMockQuery", () => {
  it("treats only the literal true value as mock mode", () => {
    expect(isPracticeMockQuery(undefined)).toBe(false);
    expect(isPracticeMockQuery("true")).toBe(true);
    expect(isPracticeMockQuery("false")).toBe(false);
    expect(isPracticeMockQuery("1")).toBe(false);
    expect(isPracticeMockQuery("TRUE")).toBe(false);
  });

  it("uses the last repeated query value", () => {
    expect(isPracticeMockQuery(["false", "true"])).toBe(true);
    expect(isPracticeMockQuery(["true", "false"])).toBe(false);
    expect(isPracticeMockQuery([])).toBe(false);
  });
});
