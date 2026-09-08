import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { OpportunityActions } from "./opportunity-actions";

const writeText = vi.fn(async () => undefined);

Object.assign(navigator, {
  clipboard: { writeText },
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
    questionCount: 0,
    questionPrepStatus: "idle",
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

  it("labels the questions action as preparing while generating", () => {
    render(
      <OpportunityActions item={item({ questionPrepStatus: "generating" })} />,
    );
    expect(screen.getByTestId("questions-opportunity-opp-2")).toHaveTextContent(
      "Preparing questions",
    );
  });
});
