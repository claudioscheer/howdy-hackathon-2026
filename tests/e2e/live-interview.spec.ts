import { expect, test } from "@playwright/test";

const cannedFollowUp =
  "Can you make that more specific? Describe the situation, what you personally did, and the result.";

test.describe("live practice interview", () => {
  test.skip(
    process.env.LIVE_PRACTICE !== "1",
    "Opt-in live interview against the running app.",
  );

  test("sends a weak answer to the live interviewer and gets a real follow-up", async ({
    page,
  }) => {
    const distinctive = `Name the last cache you reversed in Howdy live ${Date.now()}.`;
    const candidateName = `Live Riley ${String(Date.now())}`;

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
      .fill(`${candidateName}. Fullstack engineer who reversed a cache.`);
    await page.getByTestId("create-opportunity-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const card = page.locator("[data-testid^='opportunity-card-']").filter({
      hasText: candidateName,
    });
    await card
      .locator("[data-testid^='questions-opportunity-']")
      .first()
      .click();
    await page.getByTestId("question-prompt-0").fill(distinctive);
    await page.getByTestId("save-questions-submit").click();
    await page.getByTestId("open-practice-link").click();
    await expect(page).toHaveURL(/\/practice\/opp-/);

    await page.getByTestId("start-interview-button").click();
    await expect(page.getByTestId("current-question")).toContainText(
      distinctive,
    );

    await page
      .getByTestId("candidate-answer")
      .fill("Okay, I owned blah blah a row but it was a man.");
    await page.getByTestId("submit-answer").click();
    await expect(page.getByTestId("submit-answer")).toHaveText(
      "Submit answer",
      {
        timeout: 45_000,
      },
    );
    await expect(page.getByTestId("follow-up-count")).toHaveText(
      "Follow-ups on this question: 1 of 2",
    );

    const followUp = page.getByTestId("current-question");
    await expect(followUp).not.toContainText(distinctive);
    const followUpText = await followUp.innerText();
    expect(followUpText.toLowerCase()).not.toEqual(
      cannedFollowUp.toLowerCase(),
    );

    await page
      .getByTestId("candidate-answer")
      .fill("That was enough, that was very specific.");
    await page.getByTestId("submit-answer").click();
    await expect(page.getByTestId("submit-answer")).toHaveText(
      "Submit answer",
      {
        timeout: 45_000,
      },
    );
    await expect(page.getByTestId("follow-up-count")).toHaveText(
      "Follow-ups on this question: 2 of 2",
    );
  });
});
