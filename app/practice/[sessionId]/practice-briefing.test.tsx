import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSeededSession } from "@/lib/interview/seed";
import { PracticeBriefing } from "./practice-briefing";

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
});
