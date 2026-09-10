export const QUESTION_PREP_DELAY_MS = 1500;
export const QUESTION_POLL_INTERVAL_MS = 3000;

export async function waitForQuestionPrep(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, QUESTION_PREP_DELAY_MS);
  });
}
