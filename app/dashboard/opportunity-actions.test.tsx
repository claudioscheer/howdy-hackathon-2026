import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";
import { OpportunityActions } from "./opportunity-actions";

const writeText = vi.fn(async () => undefined);

Object.assign(navigator, {
  clipboard: { writeText },
});

afterEach(() => {
  vi.useRealTimers();
});

function item(overrides: Partial<OpportunityItem> = {}): OpportunityItem {
  return {
    id: "opp-2",
    role: "fullstack",
    seniority: "senior",
    track: "React",
    attemptsLimit: 2,
    attemptsUsed: 0,
    status: "Active",
    token: "fs-3b17c",
    practiceSessionId: "fullstack-product-engineer",
    hasBriefing: true,
    questionCount: 3,
    questionPrepStatus: "ready",
    ...overrides,
  };
}

describe("OpportunityActions", () => {
  it("copies the practice link and shows copied state", async () => {
    render(<OpportunityActions item={item()} />);
    fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent("Copied");
  });

  it("resets the copied label after two seconds", async () => {
    vi.useFakeTimers();
    render(<OpportunityActions item={item()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent(
      "Copy link",
    );
  });

  it("shows a failure label when the clipboard rejects, then resets", async () => {
    vi.useFakeTimers();
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<OpportunityActions item={item()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent(
      DASHBOARD_PAGE.copyFailedButton,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent(
      "Copy link",
    );
  });

  it("restarts the reset timer on repeated copies", async () => {
    vi.useFakeTimers();
    render(<OpportunityActions item={item()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent("Copied");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("copy-link-opp-2")).toHaveTextContent(
      "Copy link",
    );
  });

  it("clears the pending reset timer on unmount", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<OpportunityActions item={item()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-link-opp-2"));
    });
    const resetIndex = setTimeoutSpy.mock.calls.findIndex(
      (call) => call[1] === 2000,
    );
    const resetTimer = setTimeoutSpy.mock.results[resetIndex]?.value;
    expect(resetTimer).toBeDefined();
    expect(clearTimeoutSpy).not.toHaveBeenCalledWith(resetTimer);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(resetTimer);
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("labels the questions action as preparing while generating", () => {
    render(
      <OpportunityActions item={item({ questionPrepStatus: "generating" })} />,
    );
    expect(screen.getByTestId("questions-opportunity-opp-2")).toHaveTextContent(
      "Preparing questions",
    );
    expect(screen.queryByTestId("open-practice-opp-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("copy-link-opp-2")).not.toBeInTheDocument();
  });

  it.each([
    ["inactive", { status: "Expired" as const }],
    ["questions are not ready", { questionPrepStatus: "idle" as const }],
    ["questions are empty", { questionCount: 0 }],
    ["attempts are exhausted", { attemptsUsed: 2, attemptsLimit: 3 }],
  ])("hides unusable practice actions when %s", (_reason, overrides) => {
    render(<OpportunityActions item={item(overrides)} />);
    expect(screen.queryByTestId("open-practice-opp-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("copy-link-opp-2")).not.toBeInTheDocument();
  });

  it("opens an eligible persisted practice session", () => {
    render(<OpportunityActions item={item()} />);
    expect(screen.getByTestId("open-practice-opp-2")).toHaveAttribute(
      "href",
      "/practice/fullstack-product-engineer",
    );
  });
});
