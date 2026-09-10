import { planReadiness } from "./brief";
import type {
  InterviewQuestion,
  OpportunityProfile,
  QuestionPlan,
} from "./contracts";

export const INTRO_MINUTES = 3;
export const CLOSE_MINUTES = 4;
export const TARGET_MINUTES_MIN = 35;
export const TARGET_MINUTES_MAX = 45;
export const MIN_QUESTION_MINUTES = 5;
export const MAX_QUESTION_MINUTES = 25;
export const MIN_AGENDA_MINUTES = 32;

export function questionTimeBudget(question: InterviewQuestion): number {
  return question.brief?.timeBudgetMinutes ?? 0;
}

export function maxQuestionCount(targetMinutes: number): number {
  const scored = targetMinutes - INTRO_MINUTES - CLOSE_MINUTES;
  return Math.max(1, Math.floor(scored / MIN_QUESTION_MINUTES));
}

type InterviewType = OpportunityProfile["interviewType"];

export function briefedPlanProblems(
  plan: QuestionPlan,
  interviewType: InterviewType,
): string[] {
  if (planReadiness(plan.questions) !== "briefed") {
    return [
      "Briefed evaluation requires a complete interviewer brief on every question.",
    ];
  }
  return [
    ...duplicatePromptProblems(plan.questions),
    ...duplicateCompetencyProblems(plan.questions),
    ...coverageProblems(plan.questions, interviewType),
    ...budgetProblems(plan, interviewType),
  ];
}

export function promptOnlyPlanProblems(
  questions: InterviewQuestion[],
): string[] {
  return duplicatePromptProblems(questions);
}

export function savedPlanProblems(
  plan: QuestionPlan,
  interviewType: InterviewType,
): string[] {
  const readiness = planReadiness(plan.questions);
  if (readiness === "prompt_only") {
    return promptOnlyPlanProblems(plan.questions);
  }
  return briefedPlanProblems(plan, interviewType);
}

function duplicatePromptProblems(questions: InterviewQuestion[]): string[] {
  const seen = new Set<string>();
  for (const question of questions) {
    const key = question.prompt.trim().toLowerCase();
    if (seen.has(key)) {
      return ["The plan repeats a question prompt."];
    }
    seen.add(key);
  }
  return [];
}

function duplicateCompetencyProblems(questions: InterviewQuestion[]): string[] {
  const seen = new Set<string>();
  for (const question of questions) {
    const competency = question.brief?.competency.trim().toLowerCase();
    if (competency === undefined || competency.length === 0) {
      continue;
    }
    if (seen.has(competency)) {
      return ["The plan repeats a competency."];
    }
    seen.add(competency);
  }
  return [];
}

function coverageProblems(
  questions: InterviewQuestion[],
  interviewType: InterviewType,
): string[] {
  const cores = questions.filter(
    (question) => question.brief?.importance === "core",
  ).length;
  if (interviewType === "system_design") {
    if (cores !== 1) {
      return [
        "A system-design plan must have exactly one core scenario so inner probes share one follow-up cap.",
      ];
    }
    return [];
  }
  if (cores < 2) {
    return ["The plan needs at least two core questions."];
  }
  return [];
}

function budgetProblems(
  plan: QuestionPlan,
  interviewType: InterviewType,
): string[] {
  const problems: string[] = [];
  if (
    plan.targetMinutes < TARGET_MINUTES_MIN ||
    plan.targetMinutes > TARGET_MINUTES_MAX
  ) {
    problems.push("The plan must target close to 40 minutes.");
  }
  if (plan.questions.length > maxQuestionCount(plan.targetMinutes)) {
    problems.push(
      "The plan has more questions than a close-to-40-minute interview can hold.",
    );
  }
  for (const question of plan.questions) {
    const minutes = questionTimeBudget(question);
    if (minutes < MIN_QUESTION_MINUTES || minutes > MAX_QUESTION_MINUTES) {
      problems.push("Each question needs a time budget that fits a live turn.");
      break;
    }
  }
  const questionMinutes = plan.questions.reduce((sum, question) => {
    return sum + questionTimeBudget(question);
  }, 0);
  const agenda = questionMinutes + INTRO_MINUTES + CLOSE_MINUTES;
  if (agenda > plan.targetMinutes) {
    problems.push("Question time budgets do not fit the agenda envelope.");
  }
  if (agenda < MIN_AGENDA_MINUTES) {
    problems.push("The plan is too short for a close-to-40-minute interview.");
  }
  const cores = plan.questions.filter(
    (question) => question.brief?.importance === "core",
  ).length;
  const reserved = interviewType === "system_design" ? 1 : cores;
  if (plan.sessionAnswerBudget < reserved) {
    problems.push(
      "The answer budget cannot reserve an opening for every core.",
    );
  }
  return problems;
}
