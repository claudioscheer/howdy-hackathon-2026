# Three-minute demo script

Rehearsal script for the Dev Day video: about 90 seconds of product, then about
90 seconds of harness and orchestration. Every answer below is taken from the
seeded plan and checked against the scripted evaluator, so the run behaves the
same way every time.

## Before recording

1. `pnpm db:seed` so that `opp-2` / `fullstack-product-engineer` is fresh.
2. Start the app with `PRACTICE_LIVE_EVALUATOR=0` so every turn is deterministic.
3. Keep these tabs open: `/dashboard`, `acceptance.json`,
   `evals/goldens/api-topic-isolated-from-conflict.json`, and a terminal holding
   a finished `pnpm run verify` (the full gate takes minutes, so record it
   beforehand).
4. Keep each answer below ready to paste.

## Product (about 90 s)

| Time | Screen              | Action                                                          | Say                                                                                                  |
| ---- | ------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0:00 | `/dashboard`        | Show the Alex Rivera card                                       | "A manager sets up a fictional opportunity and shares a practice link."                              |
| 0:10 | Card                | **Open practice**, then **Start interview**                     | "The candidate needs no account and gets the saved plan: three questions."                           |
| 0:20 | Q1 (disagreement)   | Paste the **vague** answer                                      | "A vague answer isn't accepted…"                                                                     |
| 0:30 | Follow-up appears   | Point at "Follow-ups on this question: 1 of 2"                  | "…it follows up, with a hard cap of two per question, enforced by a reducer rather than the model."  |
| 0:40 | Follow-up           | Paste the **concrete Q1** answer                                | "Concrete evidence moves the interview on."                                                          |
| 0:50 | Q2 (API design)     | Paste the **off-topic conflict** answer                         | "Recycling the previous story doesn't work: this answer is off-topic for the API question."          |
| 1:00 | Relevance follow-up | Paste the **on-topic API** answer                               | "An on-topic answer advances to question 3."                                                         |
| 1:10 | Q3 (delivery risk)  | Paste the **Q3** answer (repeat the follow-up answers if asked) |                                                                                                      |
| 1:20 | Scorecard           | Show the four dimensions and **Export**                         | "The report covers four dimensions, and every quote is checked to be a substring of the transcript." |

### Answers

- **Q1, vague:** `I had a disagreement with a teammate but we figured it out.`
- **Q1, concrete:** `I disagreed with a teammate on an API migration, added TypeScript contract tests, and reduced partner errors by 42 percent.`
- **Q2, off-topic:** `My teammate and I had a big disagreement about code review style, we debated it and reached a compromise after a tense week.`
- **Q2, on-topic:** `I designed a versioned REST endpoint for billing, kept the payload schema backward compatible, added contract tests, and cut client breakages to zero over two releases.`
- **Q3:** `I led a staged rollout of a payments migration behind a feature flag, ran a canary at 5 percent, watched error rates, and rolled back once before shipping to 100 percent with zero incidents.`
- **Q3, if a follow-up is asked:** `Specifically, I owned the rollout plan, wrote the rollback runbook, and the result was a release with no customer-facing errors and a 30 percent faster checkout.`

> Q2 answers must use API vocabulary (api, contract, endpoint, schema,
> payload, …). Do not improvise the Q2 answer on camera.

## Harness and orchestration (about 90 s)

| Time | Screen                        | Say                                                                                                                                                                                                 |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1:30 | Terminal with `verify passed` | "One gate, `pnpm run verify`, used by every coding tool: format, build, lint, 100% coverage, behavior goldens, holdouts, mutation checks, deterministic review, and this browser journey."          |
| 1:45 | `acceptance.json`             | "The harness writes milestone truth. Two product milestones still say `false`; nobody can set them by hand."                                                                                        |
| 1:55 | Golden file                   | "A codebase audit found that question 2 was judged against question 1's topic. We wrote this golden first; it failed on the old code, then passed with the fix. It now guards every future change." |
| 2:15 | `docs/SYSTEM.md`              | "Work runs as parallel agents with non-overlapping file ownership (Engine, UI, DB, Eval), then is integrated serially behind the same gate."                                                        |
| 2:35 | `docs/AI-DEV-LOG.md`          | "Each closed act → fail → fix → pass loop is logged as evidence."                                                                                                                                   |
| 2:50 | Back to product               | "An interviewer that notices a bad answer, and a harness that notices a bad change."                                                                                                                |
