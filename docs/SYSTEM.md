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

`AGENTS.md` is the cross-tool operating contract. `npm run verify` is the single
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

No parallel workers were used for the foundation phase. Node alignment, runtime
contracts, acceptance semantics, fixture shape, and documentation were tightly
coupled; parallel edits would have created avoidable conflicts. This is an
intentional orchestration decision, not evidence of completed parallel work.

The first real Engine/UI/Evaluation split should be recorded here as a compact
timeline after it occurs, including task boundaries and integration results.

## Deterministic controls

| Guarantee                                 | Control                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Model output has the required shape       | Zod schemas in `lib/interview/contracts.ts`                              |
| Session ownership is explicit             | State and event schemas in `lib/interview/session.ts`                    |
| Follow-ups cannot continue forever        | Application policy cap of two                                            |
| Feedback cannot quote invented text       | Exact transcript-substring validation                                    |
| Trivial constant interviewers cannot pass | Always-`MOVE_ON` and always-`FOLLOW_UP` sensitivity checks               |
| Holdouts are not copies of goldens        | Containment and token-similarity review                                  |
| Changed source remains test-backed        | Local diff plus CI base-to-head deterministic review                     |
| Build quality stays observable            | Format, build/typecheck, lint, coverage, and harness in `npm run verify` |

Model judgment chooses question wording and evaluates answer quality. It does not
control question counts, state transitions, retry limits, persistence, schema
validity, or evidence grounding.

## Integration and recovery

1. Each workstream runs its focused tests.
2. The orchestrator integrates the outputs.
3. `npm run verify` runs on the supported Node version.
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
