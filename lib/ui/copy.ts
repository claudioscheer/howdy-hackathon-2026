/**
 * Landing copy is a contract the unit tests pin.
 * If this file and the page drift, `npm test` fails — that is the harness
 * catching a UI regression before anyone claims the work is done.
 */
export const LANDING = {
  badge: "Howdy Dev Day 2026",
  title: "Howdy Interview Coach",
  description:
    "Adaptive mock interviews with real-time feedback and follow-up probing.",
  startPractice: "Start practice",
  harnessHint: "Run npm run verify before calling work done.",
} as const;

export function practiceButtonLabel(): string {
  return LANDING.startPractice;
}
