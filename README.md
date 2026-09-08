# Howdy Interview Coach

Practice a realistic interview against a fictional opportunity. The interviewer
should notice vague, irrelevant, weak, or poorly structured answers, follow up
under pressure, and produce transcript-grounded feedback.

Built for Howdy Dev Day 2026. The repository currently contains the landing page,
a seeded manager-entry/dashboard facade, stable runtime contracts, and the
verification foundation. The candidate practice route and adaptive loop are the
current milestone and are not represented as complete in `acceptance.json` until
the product runtime and browser journey prove them.

## Requirements

- Node.js 22.22.3, the smallest supported LTS version shared by the current
  Next.js, Vitest, jsdom, and testing dependencies.
- pnpm 11.25.0, managed via Corepack or standalone install.

If using nvm:

```bash
nvm install
nvm use
corepack enable
```

Postgres 16 is required for the manager dashboard. Start it with
`docker compose up -d`, copy `.env.example` to `.env`, then run
`pnpm db:migrate` and `pnpm db:seed`.

## Install and run

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Open <http://localhost:3000>.

Copy `.env.example` to `.env` for `DATABASE_URL`. Do not commit `.env`.

## Verification

```bash
pnpm test
pnpm test:affected
pnpm test:e2e
pnpm run verify
```

`pnpm test` always runs the complete unit suite. `pnpm test:affected` is an
optional fast local loop. `pnpm run verify` is the only completion gate. It runs
formatting, production build/typecheck, lint, the complete unit suite with
coverage, synthetic behavioral fixtures, sensitivity checks, deterministic
changed-file review, and the repository-owned Playwright journey. It exits
nonzero and prints the failing stage when work is not ready.

Behavioral verification uses reviewed goldens plus independently worded holdouts.
It also proves that trivial always-`MOVE_ON` and always-`FOLLOW_UP` providers
cannot pass. It does not call a live model.

The harness writes:

- `acceptance.json` — shipped and unshipped product milestones;
- `evals/traces/latest-eval.json` — per-case results, sensitivity, and review
  evidence.

See [the harness guide](./docs/HARNESS.md) for guarantees and limitations.

## Documentation

| File                                                                 | Purpose                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/SPEC.md](./docs/SPEC.md)                                       | Product objective, scope, runtime architecture, and definition of done |
| [docs/SYSTEM.md](./docs/SYSTEM.md)                                   | Agentic development contexts, orchestration, controls, and integration |
| [docs/AI-DEV-LOG.md](./docs/AI-DEV-LOG.md)                           | Concise evidence of authentic autonomous recovery loops                |
| [AGENTS.md](./AGENTS.md)                                             | Cross-tool repository operating instructions                           |
| [docs/HARNESS.md](./docs/HARNESS.md)                                 | Verification and behavioral-eval design                                |
| [hackathon/howdy-2026-dev-day.md](./hackathon/howdy-2026-dev-day.md) | Competition rules                                                      |

## Repository layout

```text
app/                    Next.js UI
prisma/                 Postgres schema, migrations, and fictional seed
lib/db/                 Prisma access for manager opportunity/candidate config
lib/interview/          Public runtime contracts and session event boundary
lib/harness/            Deterministic verification implementation
lib/ui/                 UI copy
evals/goldens/          Reviewed behavior fixtures
evals/holdouts/         Independently worded behavior fixtures
evals/traces/           Generated latest-run evidence
scripts/verify.sh       Canonical gate
acceptance.json         Truthful generated milestone status
docs/                   Required submission documentation and harness guide
```

All product, fixture, and demo data must remain fictional or seeded.
