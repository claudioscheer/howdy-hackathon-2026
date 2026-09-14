import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionState } from "@/lib/interview/session";
import { createSeededSession } from "@/lib/interview/seed";
import { PracticeBriefing } from "./practice-briefing";

function persistedSession(): SessionState {
  const seeded = createSeededSession();
  return {
    ...seeded,
    opportunity: {
      ...seeded.opportunity,
      role: "fullstack",
      seniority: "senior",
    },
  };
}

describe("PracticeBriefing", () => {
  it("shows role, pacing, dictation, and starts on click", () => {
    const onStart = vi.fn();
    render(
      <PracticeBriefing
        session={createSeededSession()}
        targetMinutes={40}
        onStart={onStart}
      />,
    );
    expect(screen.getByText(/Fullstack Product Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/40 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/OS dictation/)).toBeInTheDocument();
    expect(screen.queryByText(/two attempts/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("start-interview-button"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("labels a persisted role with the dashboard heading", () => {
    render(
      <PracticeBriefing
        session={persistedSession()}
        targetMinutes={40}
        onStart={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/^Senior Full stack · Attempt 1 of 2$/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/fullstack/)).not.toBeInTheDocument();
  });
});
