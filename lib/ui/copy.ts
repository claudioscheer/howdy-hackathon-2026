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
    "Sign in to configure interview templates, generate questions, and share candidate practice links.",
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
    "We'll draft scored questions for an interview close to 40 minutes. The number of questions follows the opportunity: what matters for this role, what we still need to learn, and how much time the topics can take. Intro and close are not listed here.",
  generating: "Preparing the questions…",
  generatingHint: "This takes a moment. You can review and edit them next.",
  reviewDescription:
    "The count follows this opportunity and a close-to-40-minute budget. Prefer fewer deeper questions. Set importance so the interviewer knows what to protect.",
  questionCountLabel: "scored questions · close to 40 minutes",
  questionLabel: "Question",
  competencyLabel: "What this assesses",
  importanceLabel: "Importance",
  importanceUnset: "Not set",
  importanceCore: "Core — stay on this",
  importanceSupporting: "Supporting — skip if time is short",
  importanceOptional: "Optional — drop first",
  addQuestion: "Add question",
  saveQuestions: "Save questions",
  savingQuestions: "Saving",
  generateButton: "Generate questions",
  emptyPrompt: "Enter a question the interviewer should ask.",
  briefSection: "Interviewer brief",
  roleRelevanceLabel: "Why this matters for the role",
  expectedDepthLabel: "Expected depth",
  evidenceLabel: "Evidence to listen for",
  triggersLabel: "Follow-up triggers",
  timeBudgetLabel: "Time budget (minutes)",
  answerBudgetLabel: "Answer budget",
  maxFollowUpsLabel: "Follow-up limit",
  stopWhenLabel: "Stop when",
  openPractice: "Open practice interview",
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

export const PRACTICE_PAGE = {
  badge: "Practice interview",
  briefingTitle: "Before you begin",
  formatLabel: "Format",
  formatBody:
    "Typed answers, about {minutes} minutes. Follow-ups exist so you can add concrete evidence — situation, action, and result — when an answer is vague.",
  dictationHint:
    "Prefer speaking? Use OS dictation (macOS Fn+Fn, Windows Win+H, or Whisper), then paste into the chat.",
  startButton: "Start practice interview",
  composerLabel: "Your answer",
  composerPlaceholder: "Describe what you did, why, and the measurable result.",
  submitAnswer: "Submit answer",
  evaluating: "Evaluating…",
  emptyAnswer: "Enter an answer before continuing.",
  evaluateFailed: "Your answer could not be evaluated. Please try again.",
  endInterview: "End interview",
  endConfirmTitle: "End this interview now?",
  endConfirmBody:
    "Ending now will leave remaining core competencies unassessed and mark them as insufficient evidence on your scorecard. Are you sure you want to finish?",
  endConfirm: "End interview",
  endCancel: "Keep practicing",
  progressComplete: "Interview complete",
  greeting:
    "Welcome to your practice interview for the {role} role. I'll be asking questions to explore your technical experience and decision-making. If an answer needs more detail, I'll follow up so you have an opportunity to clarify. Let's begin with our first question:",
  reportTitle: "Practice scorecard",
  reportExport: "Export scorecard",
  tryAgain: "Try again",
  attemptsUsed: "Both attempts on this link have been used.",
} as const;

export function practiceButtonLabel(): string {
  return LANDING.startPractice;
}

export function practiceFormatBody(minutes: number): string {
  return PRACTICE_PAGE.formatBody.replace("{minutes}", String(minutes));
}

export function practiceGreeting(role: string): string {
  return PRACTICE_PAGE.greeting.replace("{role}", role);
}

export function practiceProgress(
  questionIndex: number,
  questionCount: number,
  isComplete: boolean,
): string {
  if (isComplete) {
    return PRACTICE_PAGE.progressComplete;
  }
  return `Question ${questionIndex + 1} of ${questionCount}`;
}

export function formatElapsed(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
