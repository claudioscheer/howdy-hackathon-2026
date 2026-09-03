# Howdy Interview Coach

Practice interviews for Howdy candidates. The interviewer follows up when an answer is vague, then returns a scorecard grounded in the transcript.

Built for Howdy Dev Day 2026. The product UI is still a landing page. What we have working now is the **verification harness** agents must use before they call work done.

## Run the app

Node 20+ and Docker (Postgres is not used by the app yet).

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run dev          # http://localhost:3000
```

```bash
npm test             # unit tests next to the source they cover
npm run verify       # the gate: build, lint, tests, golden evals
```

`npm run verify` is silent when green. On failure it prints only the failing output and exits non-zero. Do not claim a change is done until this command passes.

## Harness

Dev Day scores harness and autonomous loops at 25 points. Agents must **build → verify → observe → fix → repeat** without a human diagnosing every failure.

What we run in `verify`:

1. Prettier (`npm run format:check`)
2. Next.js production build (typecheck)
3. ESLint — no `any` / `as unknown` / `as never`, small files, no unused vars
4. Vitest with **100%** coverage on `app/page.tsx` and `lib/`
5. Golden and holdout fixtures in `evals/` (does this answer get `FOLLOW_UP` or `MOVE_ON`?)

We do **not** use an LLM as the merge gate. Same transcript can get two scores; the judge prefers fluent prose; agents game the rubric. Schema, goldens, and unit tests are the gate. The argument is in [`docs/HARNESS.md`](./docs/HARNESS.md).

`acceptance.json` records which criteria the last harness run proved. Do not set `"passes": true` by hand.

## Docs

| File                                                                   | Why it exists                                                                             |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)                                             | How every coding tool (Grok, Codex, Antigravity, Claude, Cursor) should work in this repo |
| [`SPEC.md`](./SPEC.md)                                                 | Product spec. Not implemented yet                                                         |
| [`docs/HARNESS.md`](./docs/HARNESS.md)                                 | What we trust, what we do not, why LLM-as-judge is not a gate                             |
| [`docs/SYSTEM.md`](./docs/SYSTEM.md)                                   | Dev Day **requires** this: roles, parallel work, how we integrate                         |
| [`docs/AI-DEV-LOG.md`](./docs/AI-DEV-LOG.md)                           | Dev Day **requires** this: one recorded act → fail → fix → pass loop                      |
| [`hackathon/howdy-2026-dev-day.md`](./hackathon/howdy-2026-dev-day.md) | Competition rules                                                                         |

## Layout

```
.
├── app/                      Next.js UI. page.test.tsx sits next to page.tsx
├── lib/
│   ├── harness/              Decision schema, stub engine, their tests
│   └── ui/                   Landing copy + copy.test.ts
├── evals/
│   ├── goldens/              Frozen Q/A → expected FOLLOW_UP or MOVE_ON
│   ├── holdouts/             Same idea; engine must not “fix” these to pass
│   └── traces/               Last harness run
├── scripts/verify.sh         Canonical gate
├── acceptance.json           Default-fail criteria, written by the harness
├── docker-compose.yml        Postgres 16 (app does not connect yet)
├── .env.example              Compose credentials template
├── AGENTS.md                 Agent instructions (all tools)
├── SPEC.md                   Product spec
└── docs/                     HARNESS, SYSTEM, AI-DEV-LOG
```
