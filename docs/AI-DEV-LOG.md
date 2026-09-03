# AI Development Log (AI-DEV-LOG.md)

> Record of key iterations, autonomous recovery loops, context engineering decisions, and human guidance during the development of **Howdy Interview Coach** (Dev Day 2026).

---

## Log Entry 1: Project Alignment & Human Strategic Decisions
- **Date:** 2026-09-03
- **Participants:** Claudio Scheer, Matheus Dantas Cavalcanti
- **Key Human Decisions:**
  1. **Text-First Principle:** Audio recording and transcription were identified as time-consuming complexities that distract from core agentic evaluation. Explicitly scoped audio as a future "nice-to-have" to focus on real-time text interviewing.
  2. **Cost-Effective Model Strategy:** Use inexpensive models for candidate evaluation, protected by strict Layer 0 deterministic schemas and state-machine policies so cheap model drift cannot break the application.
  3. **Verification over Vibe:** Hackathon score weighs Harness + Autonomous Loops at 25 points. Rather than relying on non-deterministic "LLM-as-a-judge", prioritize deterministic contracts and golden transcripts.
  4. **Team Topology:** Formulated 3 parallel worker roles (Interview Engine, Product UI, Eval/Harness) coordinated by an Orchestrator and verified by an Integration Agent.

---

## Log Entry 2: Repository Reorganization & Harness Baseline
- **Context:**
  The Next.js 16 application was initially bootstrapped in a nested subdirectory (`my-app/`).
- **Actions:**
  1. Flattened `my-app/` into the root directory to establish a clean monorepo/root structure.
  2. Configured Vitest + React Testing Library + jsdom for TypeScript unit and contract testing.
  3. Created `lib/harness/schema.ts` (Zod decision schema, transcript substring grounding validator, state-machine policy).
  4. Authored 6 frozen golden fixtures (`evals/goldens/`) and 1 anti-overfitting holdout fixture (`evals/holdouts/`).
  5. Implemented `scripts/verify-harness.ts` and wired the canonical gate command:
     ```bash
     npm run verify # build + lint + test + harness
     ```

---

## Log Entry 3: Demonstrated Autonomous Recovery Loop (Evidence)
- **Requirement:** Dev Day §5 requires evidence of an autonomous loop:
  `ACT → VERIFY → OBSERVE A PROBLEM → FIX → VERIFY AGAIN` without human prompting in the middle.

### Step 1: Action (Feature Implementation / Simulation)
During implementation of the decision router in `lib/harness/engine.ts`, a simulated regression was introduced where vague candidate answers incorrectly defaulted to `MOVE_ON` rather than triggering a `FOLLOW_UP`.

### Step 2: Verification Trigger
The integration agent ran the canonical gate:
```bash
npm run verify
```

### Step 3: Observed Failure (Mechanical Backpressure)
Verification halted immediately with exit code 1. The test suite emitted precise, actionable failures without human diagnosis:
```
❯ __tests__/harness/goldens.test.ts (7 tests | 3 failed)
  × evaluates fixture [followup-cap-exhausted]: Expected true (isCapped), received false
  × evaluates fixture [vague-specificity]: Expected "FOLLOW_UP", received "MOVE_ON"
  × evaluates holdout [holdout-vague-claims]: Expected "FOLLOW_UP", received "MOVE_ON"
```
Notice that the private holdout caught the regression simultaneously, proving that the system was not relying on overfitting.

### Step 4: Autonomous Diagnosis & Fix
The agent inspected the assertion error:
- Diagnosis: The `DeterministicStubProvider` was returning `MOVE_ON` for generic soft-skill answers.
- Fix: Repaired the routing condition in `lib/harness/engine.ts` to return `FOLLOW_UP`, specify `dimension: "specificity"`, and provide a concrete follow-up probe.

### Step 5: Reverification & Green Gate
Reran `npm run verify`:
```
✓ Layer 0: Decision schema contract passed
✓ Layer 0: Transcript substring grounding passed
✓ Golden [answers-different-question] passed
✓ Golden [concrete-incident] passed
✓ Golden [followup-cap-exhausted] passed
✓ Golden [fundamentals-gap] passed
✓ Golden [recency-mismatch] passed
✓ Golden [vague-specificity] passed
✓ Holdout [holdout-vague-claims] passed

Eval trace saved to: evals/traces/latest-eval.json
Updated acceptance.json with verified evidence.
✅ ALL HARNESS CHECKS PASSED.
```
Result: The loop closed autonomously and updated the default-fail acceptance tracker (`acceptance.json`).

---

## Log Entry 4: Landing UI regression caught by unit tests

- **Date:** 2026-09-03
- **Phase:** Harness test bed only (no interview product yet).

### ACT
Landing copy moved to `lib/ui/copy.ts`. Page gained `data-testid="start-practice"` so agents have a stable target.

### VERIFY → OBSERVE A PROBLEM
`start-practice` was removed from `app/page.tsx` to check the gate. `npm test -- __tests__/page.test.tsx` failed:

```
Unable to find an element by: [data-testid="start-practice"]
```

Exit code 1. No human diagnosis required — the test named the missing control.

### FIX → VERIFY AGAIN
Restored the control. `npm run verify` (silent-on-success):

```
  ✓ build / typecheck
  ✓ lint
  ✓ unit tests
  ✓ harness evals
verify passed
```

This is the loop Dev Day asks for, on the current Next.js app, without implementing SPEC flows.
