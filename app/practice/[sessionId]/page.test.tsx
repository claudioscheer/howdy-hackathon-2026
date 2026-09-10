import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEEDED_SESSION_ID, createSeededSession } from "@/lib/interview/seed";
import PracticePage from "./page";

const loadPracticeSession = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("@/lib/interview/practice-session", () => ({
  loadPracticeSession,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

describe("PracticePage", () => {
  it("renders a loaded practice session", async () => {
    loadPracticeSession.mockResolvedValue(createSeededSession());
    render(
      await PracticePage({
        params: Promise.resolve({ sessionId: SEEDED_SESSION_ID }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Practice interview" }),
    ).toBeInTheDocument();
  });

  it("uses the route not-found boundary for an unknown session", async () => {
    loadPracticeSession.mockResolvedValue(null);
    await expect(
      PracticePage({ params: Promise.resolve({ sessionId: "unknown" }) }),
    ).rejects.toThrow("not found");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
