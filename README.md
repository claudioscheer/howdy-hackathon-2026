# Howdy Interview Coach

Practice a realistic interview against a fictional opportunity. The interviewer
should notice vague, irrelevant, weak, or poorly structured answers, follow up
under pressure, and produce transcript-grounded feedback.

Built for Howdy Dev Day 2026. The repository currently contains the landing page,
stable runtime contracts, and verification foundation. The end-to-end interview
product is the next milestone and is not represented as complete in
`acceptance.json`.

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

Postgres is not required by the application. `docker-compose.yml` is retained as
an optional future scaffold and should not be started for the current build.

## Install and run

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

No environment variables are currently required. `.env.example` documents only
the deferred Postgres scaffold.

## Verification

```bash
pnpm test
pnpm run verify
```

`pnpm run verify` is the only completion gate. It runs formatting, production
build/typecheck, lint, 100% unit coverage, synthetic behavioral fixtures,
sensitivity checks, and deterministic changed-file review. It exits nonzero and
prints the failing stage when work is not ready.

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
