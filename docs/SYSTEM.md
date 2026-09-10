# Agentic engineering system

This document describes how agents build Howdy Interview Coach. Product runtime
architecture is defined separately in `SPEC.md`; the application does not run a
team of software-engineering agents.

## Operating loop

```text
Human sets intent and risk boundaries
              ↓
Orchestrator stabilizes contracts and assigns bounded work
              ↓
Independent contexts implement non-overlapping work
              ↓
Serial integration: verify → inspect → fix → verify
              ↓
Human decides whether the milestone is acceptable
```

`AGENTS.md` is the cross-tool operating contract. `pnpm run verify` is the single
machine-readable completion gate.

## Context strategy

Workers receive the product objective, the public contract relevant to their
task, their owned paths, acceptance criteria, and relevant source files. They do
not receive every planning artifact or another worker's implementation details.

A handoff is short and contains:

- changed paths;
- contracts consumed or changed;
- verification commands and results;
- unresolved risks or integration needs.

Model-boundary DTOs and reducer events in `lib/interview/` are shared context.
Changes to those contracts are integration decisions, not unilateral worker
changes.

## Workstreams after the foundation phase

| Workstream         | Owns                                                    | Receives                                         | Must not change                             |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| Interview Engine   | `lib/interview/`, model adapters, deterministic reducer | Product rules, public schemas, relevant fixtures | UI or eval-owned holdouts                   |
| Product UI         | `app/`, `lib/ui/`                                       | User journey, public state/DTOs, fictional seed  | Model heuristics or holdout labels          |
| Evaluation/Harness | `evals/`, `lib/harness/`, verification/browser scripts  | Public behavior contract and rubric              | Product implementation to make an eval pass |

These streams can run in parallel only after contracts are stable and their write
paths do not overlap. Integration remains serial and is owned by the
orchestrator.

## Current parallelization evidence

The persisted-practice work began with a contract freeze and three independent
contexts owning a persistence adapter, product UI, and harness/browser proof.
Before integration, `main` gained a richer saved-plan runtime, OpenCode planner,
interviewer briefs, and background generation. The orchestrator therefore
discarded the now-duplicate adapter and session factory instead of preserving two
implementations. It rebased onto the newer architecture, retained the independent
UI and public-runtime proof outcomes, repaired the canonical migrate/seed gate,
and integrated serially. No OpenCode, brief, relevance, or session-policy work
from `main` was replaced.

| Context                | Original owned paths                  | Reconciled result                                                     |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Persisted runtime/data | `lib/db/practice-session*`            | Superseded by `lib/interview/practice-session`; duplicate was dropped |
| Product UI             | Dashboard actions and practice route  | Dashboard entry retained; newer practice route/state wiring kept      |
| Evaluation/Harness     | Harness proof, acceptance, Playwright | Adapted to the newer product constructor and stored-plan browser path |
| Serial integration     | Shared docs and verification scripts  | Main architecture preserved; one canonical gate remains               |

### Seeded adaptive-loop milestone

The seeded adaptive-loop milestone used the first real three-way split. Phase 0
was serial: the orchestrator standardized two attempts, the practice route,
seeded-login semantics, full local tests, Playwright configuration, and the
shared state/event boundary in commit `91f698c`. Only then were three independent
contexts started against frozen contracts.

| Sequence | Context            | Owned paths                                      | Handoff                                                                                             |
| -------- | ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1        | Interview Engine   | `lib/interview/**`                               | Reducer, seeded session, replaceable evaluator, turn coordinator; 24 focused tests at 100% coverage |
| 1        | Product UI         | `app/**`, `lib/ui/**`                            | Dashboard link and practice experience; 49 UI tests at 100% scoped coverage                         |
| 1        | Evaluation/Harness | `evals/**`, `lib/harness/**`, browser/gate files | Public-runtime scenarios, mutations, and Playwright journey                                         |
| 2        | Integration        | Shared acceptance/docs and combined tree         | Engine API → UI → harness → full gate → browser inspection                                          |

The workstreams began concurrently and wrote non-overlapping product paths. The
Evaluation context's deterministic review found that the UI's new
`practice-view.tsx` lacked a colocated test; that precise finding was returned to
the UI owner, which added the test and reran its suite. The Evaluation context
later exhausted its workspace credit before its final handoff, so the
orchestrator reviewed and completed that bounded integration rather than
inventing a successful worker result. No frozen contract changed after dispatch.

## Deterministic controls

| Guarantee                                 | Control                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Model output has the required shape       | Zod schemas in `lib/interview/contracts.ts`                                                |
| Session ownership is explicit             | State and event schemas in `lib/interview/session.ts`                                      |
| Follow-ups cannot continue forever        | Application policy cap of two                                                              |
| Feedback cannot quote invented text       | Exact transcript-substring validation                                                      |
| Trivial constant interviewers cannot pass | Always-`MOVE_ON` and always-`FOLLOW_UP` sensitivity checks                                 |
| Holdouts are not copies of goldens        | Containment and token-similarity review                                                    |
| Changed source remains test-backed        | Local diff plus CI base-to-head deterministic review                                       |
| Build quality stays observable            | Format, build/typecheck, lint, full coverage, harness, and Playwright in `pnpm run verify` |

Model judgment chooses question wording and evaluates answer quality. It does not
control question counts, state transitions, retry limits, persistence, schema
validity, or evidence grounding.

## Integration and recovery

1. Each workstream runs its focused tests.
2. The orchestrator integrates the outputs.
3. `pnpm run verify` runs on the supported Node version.
4. Product milestones also receive browser verification.
5. A failure is returned to the owner with the smallest relevant context.
6. The owner fixes it and reruns verification without waiting for a new human
   instruction.

Only complete act → fail → diagnose → fix → pass loops are added to
`AI-DEV-LOG.md`. Generated per-case traces remain in
`evals/traces/latest-eval.json`.

## Human decisions

The human owns product scope, material architecture changes, external service
selection, evaluation labels that are genuinely ambiguous, risk acceptance, and
release readiness. Agents own bounded implementation and recovery inside those
decisions.
