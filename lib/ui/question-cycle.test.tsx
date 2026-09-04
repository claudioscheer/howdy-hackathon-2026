import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANDING } from "@/lib/ui/copy";
import { QuestionCycle } from "@/lib/ui/question-cycle";
import {
  QUESTION_DELETE_MS,
  QUESTION_HOLD_MS,
  QUESTION_TYPE_MS,
} from "@/lib/ui/question-cycle-state";

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

interface MediaMock {
  matches: boolean;
  media: string;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
  addListener: () => void;
  removeListener: () => void;
  dispatchEvent: () => boolean;
  listeners: Array<() => void>;
}

function mockMatchMedia(matches: boolean): MediaMock {
  const media: MediaMock = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    listeners: [],
    addEventListener: (event: string, listener: () => void) => {
      if (event === "change") {
        media.listeners.push(listener);
      }
    },
    removeEventListener: (event: string, listener: () => void) => {
      media.listeners = media.listeners.filter((entry) => entry !== listener);
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => media,
  });
  return media;
}

const startFirst = (): number => 0;

describe("QuestionCycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("keeps the first question still when motion is reduced", () => {
    mockMatchMedia(true);
    render(<QuestionCycle random={startFirst} />);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(
      LANDING.title,
    );
    vi.advanceTimersByTime(QUESTION_HOLD_MS + QUESTION_DELETE_MS * 20);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(
      LANDING.title,
    );
  });

  it("deletes after a hold, then types the next question", async () => {
    mockMatchMedia(false);
    render(<QuestionCycle random={startFirst} />);
    expect(screen.getByTestId("question-cycle")).toHaveAttribute(
      "data-reduced",
      "false",
    );
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(
      LANDING.title,
    );
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    advance(QUESTION_HOLD_MS);
    advance(QUESTION_DELETE_MS);
    expect(screen.getByTestId("hero-question-typed").textContent).toBe(
      LANDING.title.slice(0, -1),
    );
    expect(screen.getByTestId("hero-caret")).not.toHaveClass("landing-caret");
    for (let step = 0; step < LANDING.title.length + 1; step += 1) {
      advance(QUESTION_DELETE_MS);
    }
    advance(QUESTION_TYPE_MS);
    expect(screen.getByTestId("hero-question-typed").textContent).toBe(
      LANDING.questions[1].slice(0, 1),
    );
  });

  it("pauses while hovered or the tab is hidden", async () => {
    mockMatchMedia(false);
    render(<QuestionCycle random={startFirst} />);
    fireEvent.mouseEnter(screen.getByTestId("question-cycle"));
    advance(QUESTION_HOLD_MS);
    advance(QUESTION_DELETE_MS);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(
      LANDING.title,
    );
    fireEvent.mouseLeave(screen.getByTestId("question-cycle"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    advance(QUESTION_HOLD_MS);
    advance(QUESTION_DELETE_MS);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(
      LANDING.title,
    );
  });

  it("treats missing matchMedia as reduced motion", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    render(<QuestionCycle random={startFirst} />);
    expect(screen.getByTestId("question-cycle")).toHaveAttribute(
      "data-reduced",
      "true",
    );
  });

  it("renders an empty prompt when no questions are provided", () => {
    mockMatchMedia(false);
    render(<QuestionCycle questions={[]} random={startFirst} />);
    expect(screen.getByTestId("hero-question-typed").textContent).toBe("");
  });

  it("resumes after the pointer leaves", () => {
    mockMatchMedia(false);
    render(<QuestionCycle random={startFirst} />);
    fireEvent.mouseEnter(screen.getByTestId("question-cycle"));
    advance(QUESTION_HOLD_MS);
    fireEvent.mouseLeave(screen.getByTestId("question-cycle"));
    advance(QUESTION_HOLD_MS);
    advance(QUESTION_DELETE_MS);
    expect(screen.getByTestId("hero-question-typed").textContent).toBe(
      LANDING.title.slice(0, -1),
    );
  });

  it("starts cycling when reduced motion is turned off", async () => {
    const media = mockMatchMedia(true);
    render(<QuestionCycle random={startFirst} />);
    await act(async () => {
      media.matches = false;
      for (const listener of media.listeners) {
        listener();
      }
    });
    advance(QUESTION_HOLD_MS);
    advance(QUESTION_DELETE_MS);
    expect(screen.getByTestId("hero-question-typed").textContent).toBe(
      LANDING.title.slice(0, -1),
    );
  });

  it("opens on a random question and blinks a hard caret", () => {
    mockMatchMedia(true);
    const last = LANDING.questions[LANDING.questions.length - 1] ?? "";
    render(<QuestionCycle random={() => 0.99} />);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent(last);
    expect(screen.getByTestId("hero-caret")).toHaveClass("landing-caret");
  });

  it("keeps the opening pick if questions change later", () => {
    mockMatchMedia(true);
    const { rerender } = render(
      <QuestionCycle questions={["one"]} random={() => 0} />,
    );
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent("one");
    rerender(<QuestionCycle questions={["one", "two"]} random={() => 0.99} />);
    expect(screen.getByTestId("hero-question-typed")).toHaveTextContent("one");
  });
});
