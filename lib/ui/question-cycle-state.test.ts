import { describe, expect, it } from "vitest";
import {
  delayFor,
  initialCycleState,
  longestQuestion,
  pickStartIndex,
  QUESTION_DELETE_MS,
  QUESTION_HOLD_MS,
  QUESTION_TYPE_MS,
  tickCycle,
} from "@/lib/ui/question-cycle-state";

const QUESTIONS = ["ab", "cd"] as const;

describe("question cycle state", () => {
  it("starts on a chosen question and holds", () => {
    expect(initialCycleState(QUESTIONS)).toEqual({
      index: 0,
      displayed: "ab",
      phase: "holding",
    });
    expect(initialCycleState(QUESTIONS, 1)).toEqual({
      index: 1,
      displayed: "cd",
      phase: "holding",
    });
    expect(initialCycleState([])).toEqual({
      index: 0,
      displayed: "",
      phase: "holding",
    });
    const holes: string[] = [];
    holes.length = 2;
    expect(initialCycleState(holes, 0)).toEqual({
      index: 0,
      displayed: "",
      phase: "holding",
    });
  });

  it("maps a random draw onto a question index", () => {
    expect(pickStartIndex(0)).toBe(0);
    expect(pickStartIndex(3, () => 0)).toBe(0);
    expect(pickStartIndex(3, () => 0.99)).toBe(2);
    expect(pickStartIndex(3, () => -1)).toBe(0);
    expect(pickStartIndex(3, () => 1)).toBe(2);
    expect(pickStartIndex(1)).toBe(0);
  });

  it("picks the longest question for layout", () => {
    expect(longestQuestion(["aa", "bbbb", "c"])).toBe("bbbb");
    expect(longestQuestion([])).toBe("");
  });

  it("uses slower hold than type or delete", () => {
    expect(delayFor("holding")).toBe(QUESTION_HOLD_MS);
    expect(delayFor("deleting")).toBe(QUESTION_DELETE_MS);
    expect(delayFor("typing")).toBe(QUESTION_TYPE_MS);
    expect(QUESTION_HOLD_MS).toBeGreaterThan(QUESTION_TYPE_MS);
  });

  it("deletes, types the next question, then holds", () => {
    let state = initialCycleState(QUESTIONS);
    state = tickCycle(state, QUESTIONS);
    expect(state.phase).toBe("deleting");
    state = tickCycle(state, QUESTIONS);
    expect(state.displayed).toBe("a");
    state = tickCycle(state, QUESTIONS);
    expect(state.displayed).toBe("");
    state = tickCycle(state, QUESTIONS);
    expect(state).toEqual({ index: 1, displayed: "", phase: "typing" });
    state = tickCycle(state, QUESTIONS);
    expect(state.displayed).toBe("c");
    state = tickCycle(state, QUESTIONS);
    expect(state).toEqual({ index: 1, displayed: "cd", phase: "holding" });
  });

  it("wraps to the first question and ignores empty lists", () => {
    const readyToWrap = {
      index: 1,
      displayed: "",
      phase: "deleting" as const,
    };
    expect(tickCycle(readyToWrap, QUESTIONS).index).toBe(0);
    expect(tickCycle(readyToWrap, [])).toEqual(readyToWrap);
    expect(
      tickCycle({ index: 9, displayed: "x", phase: "holding" }, QUESTIONS),
    ).toEqual({ index: 9, displayed: "x", phase: "holding" });
  });
});
