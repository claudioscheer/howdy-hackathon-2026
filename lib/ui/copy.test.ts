import { describe, it, expect } from "vitest";
import { LANDING, practiceButtonLabel } from "@/lib/ui/copy";

describe("landing copy", () => {
  it("keeps the practice button label stable", () => {
    expect(practiceButtonLabel()).toBe("Start practice");
    expect(LANDING.startPractice).toBe("Start practice");
  });
});
