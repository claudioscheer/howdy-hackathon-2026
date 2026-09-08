import { expect, test } from "@playwright/test";

test("dashboard opens an adaptive practice interview", async ({ page }) => {
  const browserIssues: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) =>
    browserIssues.push(`pageerror: ${error.message}`),
  );

  await page.goto("/dashboard");

  const practiceLink = page.getByRole("link", {
    name: "Open Practice Interview",
  });
  await expect(practiceLink).toHaveAttribute(
    "href",
    "/practice/fullstack-product-engineer",
  );
  await practiceLink.click();

  await expect(page).toHaveURL(/\/practice\/fullstack-product-engineer$/);
  await expect(page.getByTestId("question-progress")).toHaveText(
    "Question 1 of 3",
  );
  await expect(page.getByTestId("current-question")).toContainText(
    "difficult technical disagreement",
  );

  const transcript = page.getByRole("list", {
    name: "Interview transcript",
  });
  await expect(transcript).toContainText("interviewer");

  const answer = page.getByRole("textbox", { name: "Your answer" });
  const weakAnswer = "I communicate well and keep everyone aligned.";
  await answer.fill(weakAnswer);
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByTestId("current-question")).toContainText(
    "make that more specific",
  );
  await expect(page.getByTestId("follow-up-count")).toHaveText(
    "Follow-ups on this question: 1 of 2",
  );
  await expect(transcript).toContainText(weakAnswer);
  await expect(transcript).toContainText("personally did");

  const strongAnswer =
    "I led three engineers through an API migration, added TypeScript contract tests, and reduced partner errors by 42 percent.";
  await answer.fill(strongAnswer);
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByTestId("question-progress")).toHaveText(
    "Question 2 of 3",
  );
  await expect(page.getByTestId("current-question")).toContainText(
    "API design decision",
  );
  await expect(transcript).toContainText(strongAnswer);
  expect(browserIssues).toEqual([]);
});
