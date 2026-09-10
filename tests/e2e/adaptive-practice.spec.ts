import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("dashboard opens a persisted adaptive practice interview", async ({
  page,
}) => {
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
  const opportunity = page.getByTestId("opportunity-card-opp-2");
  await expect(opportunity).toContainText("Alex Rivera");
  await opportunity.getByRole("link", { name: "Open practice" }).click();

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
  const weakAnswer =
    "I had a disagreement with a teammate but we figured it out.";
  await answer.fill(weakAnswer);
  await expect(answer).toHaveValue(weakAnswer);
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
    "I disagreed with a teammate on an API migration, added TypeScript contract tests, and reduced partner errors by 42 percent.";
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

test("saved manager questions reach the candidate session", async ({
  page,
}) => {
  const distinctive =
    "Name the exact caching tradeoff you reversed in the Howdy maple syrup outage.";
  const candidateName = `Riley Distinctive ${String(Date.now())}`;

  await page.goto("/login");
  await page.getByTestId("email-input").fill("manager@howdy.com");
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("create-opportunity-button").click();
  await page.getByTestId("candidateDisplayName-input").fill(candidateName);
  await page.getByTestId("targetTechStack-input").fill("React, Node.js");
  await page
    .getByTestId("jobDescription-input")
    .fill("Ship product features across React and Node.js.");
  await page
    .getByTestId("curriculum-input")
    .fill(
      `${candidateName}. Fullstack engineer who reversed a caching tradeoff.`,
    );
  await page.getByTestId("create-opportunity-submit").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const card = page.locator("[data-testid^='opportunity-card-']").filter({
    hasText: candidateName,
  });
  await card.locator("[data-testid^='questions-opportunity-']").first().click();

  await page.getByTestId("question-prompt-0").fill(distinctive);
  await page.getByTestId("save-questions-submit").click();
  await expect(page.getByTestId("open-practice-link")).toBeVisible();
  await page.getByTestId("open-practice-link").click();
  await expect(page).toHaveURL(/\/practice\/opp-/);

  await expect(page.getByTestId("current-question")).toContainText(distinctive);
});
