export const QUESTION_PREP_DELAY_MS = 1500;

export async function waitForQuestionPrep(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, QUESTION_PREP_DELAY_MS);
  });
}
