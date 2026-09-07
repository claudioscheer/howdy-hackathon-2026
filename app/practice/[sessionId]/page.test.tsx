import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEEDED_SESSION_ID } from "@/lib/interview/seed";
import PracticePage from "./page";

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("not found");
  }),
);

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

describe("PracticePage", () => {
  it("renders the seeded practice session", async () => {
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
    await expect(
      PracticePage({ params: Promise.resolve({ sessionId: "unknown" }) }),
    ).rejects.toThrow("not found");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
