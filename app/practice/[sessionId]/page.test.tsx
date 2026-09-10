import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEEDED_SESSION_ID, createSeededSession } from "@/lib/interview/seed";
import PracticePage from "./page";

const loadPracticePageData = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("@/lib/interview/practice-session", () => ({
  loadPracticePageData,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

describe("PracticePage", () => {
  it("renders the briefing for a loaded planned session", async () => {
    loadPracticePageData.mockResolvedValue({
      session: createSeededSession(),
      targetMinutes: 40,
    });
    render(
      await PracticePage({
        params: Promise.resolve({ sessionId: SEEDED_SESSION_ID }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Before you begin" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start-interview-button")).toBeInTheDocument();
  });

  it("uses the route not-found boundary for an unknown session", async () => {
    loadPracticePageData.mockResolvedValue(null);
    await expect(
      PracticePage({ params: Promise.resolve({ sessionId: "unknown" }) }),
    ).rejects.toThrow("not found");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
