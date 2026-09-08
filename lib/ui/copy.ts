/**
 * Landing copy is a contract the unit tests pin.
 * If this file and the page drift, `pnpm test` fails — that is the harness
 * catching a UI regression before anyone claims the work is done.
 */
export const LANDING = {
  badge: "Howdy Dev Day 2026",
  product: "Howdy Interview Coach",
  title: "Walk me through the last outage you caused.",
  questions: [
    "Walk me through the last outage you caused.",
    "When did you ship a review you knew was wrong?",
    "Name a systems tradeoff you would reverse today.",
    "What did you break the last time you shipped under pressure?",
    "Walk me through a bug you shipped that users found first.",
    "What did you refuse to build, and who did you disappoint?",
    "Tell me about a time you were wrong in a room of people.",
    "Walk me through a design you defended, then had to kill.",
  ],
  description: "Let your engineers hear the hard questions here first.",
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
  editButton: "Edit",
  copyLinkButton: "Copy link",
  copiedLinkButton: "Copied",
  generateQuestionsButton: "Generate questions",
  reviewQuestionsButton: "Review questions",
  preparingQuestionsButton: "Preparing questions",
  emptyState:
    "No opportunities yet. Create a role and candidate to list them here.",
  disclaimer:
    "Opportunity and candidate configuration is stored. This demo shows the two-attempt product policy; link security and expiration enforcement are not included yet.",
} as const;

export const QUESTIONS_PAGE = {
  title: "Review questions",
  generateTitle: "Prepare questions",
  generateDescription:
    "We will draft practice questions from the job description and candidate curriculum.",
  generating: "Preparing the questions…",
  generatingHint: "This takes a moment. You can review and edit them next.",
  reviewDescription:
    "Edit these prompts or add more so the candidate practices the right pressure.",
  addQuestion: "Add question",
  saveQuestions: "Save questions",
  savingQuestions: "Saving",
  generateButton: "Generate questions",
  emptyPrompt: "Enter a question the interviewer should ask.",
} as const;

export const CREATE_OPPORTUNITY_PAGE = {
  title: "Create Opportunity",
  description:
    "Paste the job description and the candidate curriculum for this role. We use both to prepare the practice interview.",
  candidateLabel: "Candidate name",
  roleLabel: "Role",
  roleHint: "The practice track, for example Full stack.",
  seniorityLabel: "Seniority",
  techStackLabel: "Target tech stack",
  techStackHint:
    "Optional. The job description can cover this. Comma-separated, for example React, Node.js, PostgreSQL",
  interviewTypeLabel: "Interview type",
  jobDescriptionLabel: "Job description",
  jobDescriptionHint: "Paste the role posting as text. No file upload.",
  curriculumLabel: "Candidate curriculum",
  curriculumHint:
    "Paste this candidate's resume for this opportunity as text. No file upload.",
  briefingOnFile: "Job description and curriculum on file",
  submitButton: "Save Opportunity",
  saveEditsButton: "Save changes",
  pendingButton: "Saving",
  backToDashboard: "Back to dashboard",
  editTitle: "Edit Opportunity",
} as const;

export function practiceButtonLabel(): string {
  return LANDING.startPractice;
}
