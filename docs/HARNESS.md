# Verification harness

`pnpm run verify` is the repository completion gate. It gives an implementation
agent deterministic back pressure it can act on without asking a human to
diagnose every failure.

## Gate stages

1. Prettier formatting check.
2. Next.js production build and TypeScript validation.
3. ESLint, including unsafe-cast and source-size restrictions.
4. The complete colocated Vitest suite with coverage across product routes and libraries.
5. Synthetic golden and independent holdout interview fixtures.
6. Behavioral sensitivity checks.
7. Deterministic changed-file review.
8. Generated `acceptance.json` and `evals/traces/latest-eval.json` evidence.
9. The Chromium Playwright journey after deterministic stages pass.

The gate is keyless and never calls a live model. A separate live-model eval may
be added later, but it must not make the merge gate nondeterministic.

## Behavior fixtures

Fixtures contain an ordered series of candidate answers and expected public
session observations: evaluator recommendation, dimension, question index,
follow-up count, history length, status, and whether rejected output left state
unchanged. They execute `lib/interview` through `submitAnswer`; the harness does
not own a second interview state machine.

- `evals/goldens/` locks reviewed behavior.
- `evals/holdouts/` checks paraphrased cases without copying golden answers.
- Expected product decisions are never inverted. A wrong `FOLLOW_UP` or
  `MOVE_ON` result is always a failed case.

The current slice locks specificity pressure, improvement after follow-up, the
two-follow-up cap, malformed evaluator output, transcript/state progression, and
relevance misses plus paraphrased recoveries around teammate-disagreement
questions. It asserts behavior and state rather than exact follow-up prose.
Evaluator evidence must be a candidate-turn substring and include a `supports`
explanation; contradiction follow-ups must cite two distinct candidate
statements.

The earlier single-turn fundamentals/structure fixtures exercised a harness-only
heuristic implementation. They were retired in this milestone rather than being
misrepresented as product evidence. Those dimensions remain in the
runtime/report contracts and must return as public-runtime scenarios when the
replaceable evaluator is expanded in a later approved milestone.

## Sensitivity instead of inverted canaries

The harness runs the behavioral suite against two deliberately broken providers:

- a provider that always returns `MOVE_ON`;
- a provider that always returns `FOLLOW_UP`.

Both mutations must be rejected by at least one fixture. This proves the suite
can detect trivial implementations without treating a known-wrong product result
as successful acceptance. The mechanism is intentionally small; it is not a
general mutation-testing framework.

## Deterministic contracts

Zod schemas enforce planner, evaluator, report, session-state, and reducer-event
shapes. `submitAnswer` rejects malformed evaluator output without changing state.
The reducer enforces the two-attempt contract and two-follow-up cap. Report
evidence is valid only when every non-empty quote is an exact substring of a
candidate turn.

## Changed-file review

Locally, review considers unstaged, staged, and untracked files. In GitHub
Actions, the workflow fetches history and supplies the pull-request base SHA or
the previous push SHA; review also considers the committed base-to-HEAD diff.

For that set it deterministically checks:

- `.env` files other than `.env.example` are absent;
- changed `app/` and `lib/` TypeScript sources have colocated tests;
- changed source files remain below the configured size limit;
- scenario IDs are unique and goldens cover `FOLLOW_UP`, `MOVE_ON`, continued
  pressure, the follow-up cap, and malformed evaluator output;
- holdout answers are independent from goldens by containment and token overlap.

This is not semantic code review. Human judgment still decides whether a change
matches the product intent.

## Truthful acceptance

`acceptance.json` separates proven foundation/harness milestones from unshipped
product milestones. The harness writes it; agents must not manually set criteria
to `true`. The adaptive interview criterion is proven by multi-turn execution of
the public runtime. Session configuration, grounded reports, and retry comparison
remain false.

## Browser journey

`pnpm test:e2e` starts the application and verifies the seeded practice
route → vague answer → visible follow-up → concrete answer → next question. The
test uses roles and user-facing text, avoids fixed sleeps, and fails on browser
console warnings/errors. CI installs only the pinned Chromium browser required by
this journey.

## Agent recovery loop

On failure, the agent reads the named stage, fixes the smallest root cause, and
runs the gate again. A completed loop may be recorded in `AI-DEV-LOG.md`; partial
or invented loops must not be added.
