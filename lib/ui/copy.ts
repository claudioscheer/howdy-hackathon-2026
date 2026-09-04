/**
 * Landing copy is a contract the unit tests pin.
 * If this file and the page drift, `pnpm test` fails — that is the harness
 * catching a UI regression before anyone claims the work is done.
 */
export const LANDING = {
  badge: "Howdy Dev Day 2026",
  title: "Howdy Interview Coach",
  description:
    "Adaptive mock interviews with real-time feedback and follow-up probing.",
  startPractice: "Login",
} as const;

export const LOGIN_PAGE = {
  badge: "DEV DAY 2026 // EM PORTAL",
  title: "Engineering Manager Login",
  description:
    "Sign in to configure interview templates, set trial limits, and generate disposable candidate invite links.",
  emailLabel: "Email",
  emailPlaceholder: "manager@howdy.com",
  passwordLabel: "Password",
  passwordPlaceholder: "********",
  submitButton: "Sign In",
  disclaimer:
    "Manager workspace: candidates access interviews exclusively via generated shareable links.",
  showcaseHeadline: "Help your engineers succeed.",
  showcaseSubline:
    "Prepare your team with real interview pressure, adaptive follow-ups, and transcript-grounded coaching.",
} as const;

export const DASHBOARD_PAGE = {
  badge: "DEV DAY 2026 // EM PORTAL",
  createButton: "Create Opportunity",
  generateLinkButton: "Generate Link",
  disclaimer:
    "Candidate access is disposable. Practice links expire after two attempts or after one week.",
} as const;

export function practiceButtonLabel(): string {
  return LANDING.startPractice;
}
