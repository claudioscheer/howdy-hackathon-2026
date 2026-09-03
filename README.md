# Howdy Interview Coach

Adaptive mock interviews for Howdy candidates, built for **Dev Day 2026**. The product is still a landing scaffold. The thing we are shipping first is the **verification harness** agents must use to build the rest.

## What this repo is right now

- A Next.js 16 app at the **repository root** (the nested `my-app/` folder is gone).
- A landing page with pinned copy and `data-testid`s so unit tests can catch UI regressions.
- A harness agents run before they claim work is done: **build → lint → unit tests → golden evals**.
- Interview *product* flows (session setup, live interviewer, reports) are **not implemented yet**. Specs stay in `SPEC.md` for later.

## Why the harness matters

Dev Day scores **Harness + Autonomous Loops at 25 points** (tied for first) and has a dedicated prize for it. Judges want:

```
BUILD → VERIFY → OBSERVE → FIX → REPEAT
```

with no human diagnosing every failure. That only works if verify tells the truth.

We do **not** use LLM-as-judge as a gate. Same transcript, two scores; verbosity bias; agents game the rubric; it is slow and needs an API key. Details: [`docs/HARNESS.md`](./docs/HARNESS.md).

What we do use:

| Layer | What | Gate? |
|---|---|---|
| 0 | Typecheck, lint, Zod decision schema, transcript substring grounding, follow-up cap | Yes |
| 1 | Frozen goldens + a holdout the engine must not overfit | Yes |
| UI unit tests | Landing copy and `data-testid`s | Yes |
| Playwright e2e | Later, stubbed LLM | Not yet |
| LLM-as-judge | Optional commentary | Never |

## Run it

Need Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest (fast). Claude Stop hook runs this.
npm run verify       # Canonical gate. Silent on success, full output on failure.
```

`npm run verify` runs `scripts/verify.sh`:

1. `npm run build` — Next.js production build / TypeScript
2. `npm run lint`
3. `npm run test` — Vitest
4. `npm run harness` — goldens, holdouts, writes `evals/traces/latest-eval.json` and updates `acceptance.json` from evidence

Do not claim a workstream is done if verify exits non-zero.

## Repository layout

```
app/                    Next.js App Router (landing only for now)
lib/ui/copy.ts          Landing copy pinned by unit tests
lib/harness/            Decision schema, stub provider, engine
__tests__/              Unit tests (page + harness contracts)
evals/goldens/          Frozen FOLLOW_UP / MOVE_ON fixtures
evals/holdouts/         Fixtures the implementer should not “fix” to pass
evals/traces/           Last harness run
scripts/verify.sh       Canonical gate (silent success)
acceptance.json         Default-fail criteria flipped only with evidence
AGENTS.md               Agent operating rules
CLAUDE.md               @AGENTS.md
docs/HARNESS.md         Why this harness, including judge flakiness
hackathon/              Dev Day rules
SPEC.md                 Product spec (future work)
```

## Agents

- Read [`AGENTS.md`](./AGENTS.md) first. [`CLAUDE.md`](./CLAUDE.md) only points there.
- Claude Code Stop hook: `.claude/hooks/stop-verify.sh` blocks stop when unit tests fail.
- Worker map and parallelization: [`docs/SYSTEM.md`](./docs/SYSTEM.md).

## Related docs

- [`SPEC.md`](./SPEC.md) — product requirements (not the current build target)
- [`docs/HARNESS.md`](./docs/HARNESS.md) — harness philosophy
- [`hackathon/howdy-2026-dev-day.md`](./hackathon/howdy-2026-dev-day.md) — scoring
