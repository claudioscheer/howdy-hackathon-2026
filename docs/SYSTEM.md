# System map

Dev Day requires this file. It is the agentic system map: who does what, what can run in parallel, and how work is checked. Operating rules live in [`AGENTS.md`](../AGENTS.md). This page is the submission-facing picture.

## Sequence

1. A human sets scope. Do not expand it.
2. Work splits into at most three roles with **non-overlapping write paths** (so they can run in parallel):
   - **Engine** — `lib/harness/` (schema, stub interviewer, follow-up cap, deterministic review)
   - **UI** — `app/`, `lib/ui/`
   - **Eval** — `evals/` (goldens, holdouts, canaries), `scripts/verify.sh`
3. **Integration** is serial: run `npm run verify`. On failure, the owner of the failing files fixes; verify again. On success, stop.

We do not spawn extra named agents. Roles exist to isolate context and files.

## Parallelism

Engine, UI, and Eval can proceed at the same time after they agree on `lib/harness/schema.ts`. They join at `npm run verify`. That is the integration point.

## Deterministic vs judgment

| Rule                                                       | Kind                                 |
| ---------------------------------------------------------- | ------------------------------------ |
| JSON shape, follow-up cap, quote must be in the transcript | Code. Always.                        |
| Frozen goldens / holdouts / canaries                       | Code. Always.                        |
| Deterministic change review (tests, independence, size)    | Code. Always.                        |
| Wording of a follow-up question                            | Model judgment, not a test assertion |
| “Was this a good interview overall?”                       | Human or optional judge. Not a gate  |

## Evidence on disk

- `acceptance.json` — last proven criteria (harness writes this; each id is independent)
- `evals/traces/latest-eval.json` — last eval run, per-case traces, review findings
- `docs/AI-DEV-LOG.md` — one autonomous loop for judges
