# Verification harness

`pnpm run verify` is the repository completion gate. It gives an implementation
agent deterministic back pressure it can act on without asking a human to
diagnose every failure.

## Gate stages

1. Prettier formatting check.
2. Next.js production build and TypeScript validation.
3. ESLint, including unsafe-cast and source-size restrictions.
4. Colocated Vitest tests with 100% coverage on changed files (running only affected tests; full suite via `pnpm run test:all`).
5. Synthetic golden and independent holdout interview fixtures.
6. Behavioral sensitivity checks.
7. Deterministic changed-file review.
8. Generated `acceptance.json` and `evals/traces/latest-eval.json` evidence.

The gate is keyless and never calls a live model. A separate live-model eval may
be added later, but it must not make the merge gate nondeterministic.

## Behavior fixtures

Fixtures contain an opportunity, structured question, candidate answer,
transcript history, optional question state, and expected decision fields. The
current deterministic stub is only a foundation seam; Phase 2 must connect these
contracts to the product runtime and add multi-turn scenarios.

- `evals/goldens/` locks reviewed behavior.
- `evals/holdouts/` checks paraphrased cases without copying golden answers.
- Expected product decisions are never inverted. A wrong `FOLLOW_UP` or
  `MOVE_ON` result is always a failed case.

The suite asserts decision and dimension rather than exact follow-up prose.

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
shapes. Application policy enforces blank-answer handling, retry limits, and the
follow-up cap. Report evidence is valid only when every non-empty quote is an
exact substring of the transcript.

## Changed-file review

Locally, review considers unstaged, staged, and untracked files. In GitHub
Actions, the workflow fetches history and supplies the pull-request base SHA or
the previous push SHA; review also considers the committed base-to-HEAD diff.

For that set it deterministically checks:

- `.env` files other than `.env.example` are absent;
- changed `app/` and `lib/` TypeScript sources have colocated tests;
- changed source files remain below the configured size limit;
- fixture IDs are unique and goldens cover all four dimensions, `MOVE_ON`, and
  the follow-up cap;
- holdout answers are independent from goldens by containment and token overlap.

This is not semantic code review. Human judgment still decides whether a change
matches the product intent.

## Truthful acceptance

`acceptance.json` separates proven foundation/harness milestones from unshipped
product milestones. The harness writes it; agents must not manually set criteria
to `true`. Session configuration, adaptive UI behavior, grounded reports, and
retry comparison remain false until their implementations and checks ship.

## Agent recovery loop

On failure, the agent reads the named stage, fixes the smallest root cause, and
runs the gate again. A completed loop may be recorded in `AI-DEV-LOG.md`; partial
or invented loops must not be added.
