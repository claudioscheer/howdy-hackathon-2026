import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionReport } from "@/lib/interview/contracts";
import { PracticeReportView } from "./practice-report-view";

const report: SessionReport = {
  attemptNumber: 1,
  summary: "A grounded attempt.",
  dimensions: {
    relevance: {
      status: "scored",
      score: 4,
      summary: "On topic.",
      evidence: [
        {
          questionId: "q1",
          quote: "I disagreed with a teammate",
        },
      ],
    },
    specificity: {
      status: "insufficient_evidence",
      summary: "Not enough evidence.",
      evidence: [],
      remainingUnknown: "The candidate ended before this competency.",
    },
    fundamentals: {
      status: "scored",
      score: 3,
      summary: "Some fundamentals.",
      evidence: [],
    },
    structure: {
      status: "scored",
      score: 2,
      summary: "Needs clearer structure.",
      evidence: [],
    },
  },
};

describe("PracticeReportView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders scores, unknown copy, quotes, and export", () => {
    const click = vi.fn();
    const revoke = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:report",
      revokeObjectURL: revoke,
    });
    const anchor = document.createElement("a");
    anchor.click = click;
    const create = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === "a") {
          return anchor;
        }
        return create(tag, options);
      },
    );

    render(<PracticeReportView report={report} />);
    expect(screen.getByTestId("report-dimension-relevance")).toHaveTextContent(
      "4 / 5",
    );
    expect(
      screen.getByTestId("report-dimension-specificity"),
    ).toHaveTextContent("Insufficient evidence");
    expect(screen.getByText(/I disagreed with a teammate/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("export-report-button"));
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:report");
  });
});
