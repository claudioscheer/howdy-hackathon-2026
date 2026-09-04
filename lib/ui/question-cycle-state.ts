export type CyclePhase = "holding" | "deleting" | "typing";

export interface CycleState {
  index: number;
  displayed: string;
  phase: CyclePhase;
}

export const QUESTION_HOLD_MS = 4500;
export const QUESTION_TYPE_MS = 36;
export const QUESTION_DELETE_MS = 20;

export function pickStartIndex(
  count: number,
  random: () => number = Math.random,
): number {
  if (count <= 0) {
    return 0;
  }
  const raw = random();
  const unit = raw < 0 ? 0 : raw >= 1 ? 0.999999 : raw;
  return Math.floor(unit * count);
}

export function initialCycleState(
  questions: readonly string[],
  startIndex = 0,
): CycleState {
  if (questions.length === 0) {
    return { index: 0, displayed: "", phase: "holding" };
  }
  const wrapped =
    ((startIndex % questions.length) + questions.length) % questions.length;
  const question = questions[wrapped];
  if (question === undefined) {
    return { index: 0, displayed: "", phase: "holding" };
  }
  return { index: wrapped, displayed: question, phase: "holding" };
}

export function longestQuestion(questions: readonly string[]): string {
  let longest = "";
  for (const question of questions) {
    if (question.length > longest.length) {
      longest = question;
    }
  }
  return longest;
}

export function delayFor(phase: CyclePhase): number {
  if (phase === "holding") {
    return QUESTION_HOLD_MS;
  }
  if (phase === "deleting") {
    return QUESTION_DELETE_MS;
  }
  return QUESTION_TYPE_MS;
}

export function tickCycle(
  state: CycleState,
  questions: readonly string[],
): CycleState {
  if (questions.length === 0) {
    return state;
  }
  const target = questions[state.index];
  if (target === undefined) {
    return state;
  }
  if (state.phase === "holding") {
    return { ...state, phase: "deleting" };
  }
  if (state.phase === "deleting") {
    if (state.displayed.length === 0) {
      const index = (state.index + 1) % questions.length;
      return { index, displayed: "", phase: "typing" };
    }
    return { ...state, displayed: state.displayed.slice(0, -1) };
  }
  const nextDisplayed = target.slice(0, state.displayed.length + 1);
  if (nextDisplayed === target) {
    return { ...state, displayed: nextDisplayed, phase: "holding" };
  }
  return { ...state, displayed: nextDisplayed };
}
