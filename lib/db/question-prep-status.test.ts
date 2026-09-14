import { describe, expect, it } from "vitest";
import {
  STALE_GENERATION_MS,
  effectiveQuestionPrepStatus,
} from "./question-prep-status";

const now = new Date("2026-09-14T12:00:00Z");

function ago(ms: number): Date {
  return new Date(now.getTime() - ms);
}

describe("effective question prep status", () => {
  it("keeps a recent generating status so polling continues", () => {
    expect(effectiveQuestionPrepStatus("generating", ago(1_000), now)).toBe(
      "generating",
    );
    expect(
      effectiveQuestionPrepStatus("generating", ago(STALE_GENERATION_MS), now),
    ).toBe("generating");
  });

  it("treats an abandoned generating status as idle so the manager can retry", () => {
    expect(
      effectiveQuestionPrepStatus(
        "generating",
        ago(STALE_GENERATION_MS + 1),
        now,
      ),
    ).toBe("idle");
  });

  it("never rewrites idle or ready, however old", () => {
    const old = ago(STALE_GENERATION_MS * 10);
    expect(effectiveQuestionPrepStatus("idle", old, now)).toBe("idle");
    expect(effectiveQuestionPrepStatus("ready", old, now)).toBe("ready");
  });

  it("defaults to the current time", () => {
    expect(
      effectiveQuestionPrepStatus(
        "generating",
        new Date(Date.now() - STALE_GENERATION_MS - 60_000),
      ),
    ).toBe("idle");
    expect(effectiveQuestionPrepStatus("generating", new Date())).toBe(
      "generating",
    );
  });
});
