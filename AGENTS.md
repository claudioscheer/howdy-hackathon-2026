<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions

This file is the source of truth for **every** coding tool (Grok, Codex, Antigravity, Claude Code, Cursor). `CLAUDE.md` only points here. Do not add tool-specific hook folders as the gate. The gate is `npm run verify`.

## What this repo is

Howdy Interview Coach: a mock interviewer that follows up on weak answers and writes a transcript-grounded report. Built for Dev Day 2026.

**Current scope:** landing page + harness. Do not implement session setup, live interview UI, reports, audio, or a live LLM adapter until a human says to. Product intent is in `SPEC.md`.

## Before you stop

```bash
npm run verify
```

Prettier, build, lint, unit tests at 100% coverage, then `evals/` goldens. Silent on success. Non-zero on failure. Never claim done if this fails. Never set `acceptance.json` `"passes": true` by hand — only `npm run harness` may do that.

On failure: read the error, change the smallest thing that fixes it, run `verify` again. If you closed a full fail → fix → pass loop, add a short note to `docs/AI-DEV-LOG.md` (Dev Day evidence). Otherwise do not pad that file.

## TypeScript and style

These are enforced by `npm run verify` (Prettier, ESLint, 100% unit coverage). Do not disable the rules.

- No `any`, no `as any`, no `as unknown`, no `as never`, no `!`, no `@ts-ignore`. Narrow IO with Zod or a type guard.
- Files under `app/` and `lib/` stay small: about 200 lines, functions about 80. Split before adding more.
- Named functions, explicit return types on exports, reuse existing helpers. Do not paste a second copy of a function.
- Do not add runtime dependencies. Use the stdlib, then what is already in `package.json` (React, Next, Zod). Ask a human before adding a library.
- Zod at the LLM/IO boundary. Do not “usually return JSON.”
- Server Components by default. `"use client"` only for state, effects, or browser APIs.
- Interactive elements need `data-testid`.
- Colocate tests: `foo.ts` → `foo.test.ts`. Cover every new branch. Coverage must stay at 100% on `app/page.tsx` and `lib/`.
- Tailwind only. No new CSS framework.
- Do not call a live LLM from tests or from `npm run verify`.
- Run `npm run format` if Prettier fails; do not hand-format around the tool.

## Postgres (later)

`docker compose up -d` starts Postgres 16. Credentials are in `.env.example`. **The app does not read the database yet.** Do not add an ORM, migrations, or queries until a human asks. When we do: one `DATABASE_URL`, parameterized queries, no secrets in git.

## Who may edit what

Roles, not extra chat personas. One agent, one column. Parallel work is allowed because the write paths do not overlap.

| Role        | Edit                                                                                                     | Do not edit                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Engine      | `lib/harness/` (schema, stub, policy, review/report helpers)                                             | `evals/holdouts/`, `evals/canaries/`, `acceptance.json`, `app/`                |
| UI          | `app/`, `lib/ui/`                                                                                        | `evals/`, `lib/harness/`, `scripts/verify-harness.ts`                          |
| Eval        | `evals/goldens/`, `evals/holdouts/`, `evals/canaries/`, `scripts/verify.sh`, `scripts/verify-harness.ts` | Product UI and engine features                                                 |
| Integration | `docs/AI-DEV-LOG.md` (only after a real loop)                                                            | Goldens, holdouts, canaries, product code (except a merge typo you introduced) |

If verify fails, the owner of the failing files fixes it. Integration runs `verify` again.

## Out of scope

- Audio, WebRTC, speech-to-text
- Whiteboard / diagram tools
- Live LLM calls in CI
- Feedback quotes that are not substrings of the transcript
- Extra named agents with no file-ownership reason
