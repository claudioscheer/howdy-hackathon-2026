<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions

This file is the source of truth for **every** coding tool (Grok, Codex, Antigravity, Claude Code, Cursor). `CLAUDE.md` only points here. Do not add tool-specific hook folders as the gate. The gate is `pnpm run verify`.

## What this repo is

Howdy Interview Coach: a mock interviewer that follows up on weak answers and writes a transcript-grounded report. Built for Dev Day 2026.

**Current state:** landing page, Prisma/Postgres manager flow, saved and generated interview plans, candidate practice route, adaptive interview loop, and repository-owned harness. Grounded feedback and retry comparison remain unshipped. Product intent and the current definition of done are in [`docs/SPEC.md`](docs/SPEC.md). Do not start a new phase or change shared contracts without human/orchestrator direction.

## Lock important behavior

An LLM will not remember last week’s contract. It rewrites nearby code to make the current task pass. That is why we wrap important behavior in `pnpm run verify` **as we ship it**, not later.

Pattern:

1. Implement the behavior (example: interviewer `FOLLOW_UP` vs `MOVE_ON`).
2. Add a machine check that fails if that behavior regresses (golden, holdout, schema proof, colocated unit test).
3. From then on, every other change must keep that check green.

Do not delete, skip, invert, or weaken a check to go green. If the behavior must change, change the fixture or test in the same diff, on purpose, and say why. New important features get the same treatment: ship the lock with the feature.

Details: [`docs/HARNESS.md`](docs/HARNESS.md).

## Before you stop

```bash
pnpm run verify
```

Use the Node version in `.nvmrc`. The gate runs Prettier, build/typecheck, lint, the complete unit suite with coverage, goldens, holdouts, mutation sensitivity, deterministic review, and the repository-owned Playwright journey. Non-zero means failure. Never claim done if this fails. Never set `acceptance.json` `"passes": true` by hand — only `pnpm run harness` may do that. Never drop a lock to make a new feature pass.

On failure: read the error, change the smallest thing that fixes it, run `verify` again. If you closed a full fail → fix → pass loop, add a short note to `docs/AI-DEV-LOG.md` (Dev Day evidence). Otherwise do not pad that file.

## TypeScript and style

These are enforced by `pnpm run verify` (Prettier, ESLint, 100% unit coverage). Do not disable the rules.

- No `any`, no `as any`, no `as unknown`, no `as never`, no `!`, no `@ts-ignore`. Narrow IO with Zod or a type guard.
- Files under `app/` and `lib/` stay small: about 200 lines, functions about 80. Split before adding more.
- Named functions, explicit return types on exports, reuse existing helpers. Do not paste a second copy of a function.
- Do not add runtime dependencies. Use the stdlib, then what is already in `package.json` (React, Next, Zod). Ask a human before adding a library.
- Zod at the LLM/IO boundary. Do not “usually return JSON.”
- Server Components by default. `"use client"` only for state, effects, or browser APIs.
- Interactive elements need `data-testid`.
- Colocate tests: `foo.ts` → `foo.test.ts`. Cover every new branch. Coverage reporting includes product route code under `app/` (excluding the framework-only root layout) and `lib/`.
- Tailwind only. No new CSS framework.
- Do not call a live LLM from tests or from `pnpm run verify`.
- Run `pnpm run format` if Prettier fails; do not hand-format around the tool.

## Postgres

`docker compose up -d` starts Postgres 16. Credentials are in `.env.example`.
The manager dashboard reads and writes opportunity/candidate rows through Prisma.
Use one `DATABASE_URL`, commit migrations, and keep secrets out of git.
Do not persist interview transcripts or change `lib/interview` contracts here.

## Who may edit what

Roles, not extra chat personas. Parallel work begins only after the public contracts in `lib/interview/contracts.ts` and `lib/interview/session.ts` are frozen for the milestone. Changing those shared files requires orchestrator coordination.

| Workstream  | Edit                                                                    | Do not edit                                          |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Engine      | New runtime implementation and model adapters under `lib/interview/`    | `app/`, eval-owned holdouts, harness outcomes        |
| UI          | `app/`, `lib/ui/`                                                       | Model heuristics, `evals/`, harness implementation   |
| Eval        | `evals/`, `lib/harness/`, verification and browser-test scripts         | Product implementation to make an eval pass          |
| Integration | Shared contracts, acceptance mapping, submission docs after real events | Product/eval labels merely to resolve merge failures |

If verify fails, the owner of the failing files fixes it. Integration runs `verify` again.

## Out of scope

- Audio, WebRTC, speech-to-text
- Whiteboard / diagram tools
- Production authentication, email delivery, Postgres/ORM work, and real Howdy integrations
- Live LLM calls in CI
- Feedback quotes that are not substrings of the transcript
- Extra named agents with no file-ownership reason

`/login` is a seeded demo entry, not production authentication. Candidate access uses the fictional `/practice/[sessionId]` route. The hackathon policy is exactly two attempts; this milestone does not persist or enforce link security or TTL.
