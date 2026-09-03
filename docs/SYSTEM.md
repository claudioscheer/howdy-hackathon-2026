# Agentic System Map & Architecture (SYSTEM.md)

> This document describes the engineering system, context boundaries, orchestration model, and parallel workstreams for **Howdy Interview Coach** (Dev Day 2026).

---

## 1. High-Level Architecture

The system coordinates specialized **roles** around deterministic contracts. The operating rules agents actually follow live in [`AGENTS.md` §3](../AGENTS.md) (file ownership, not the ASCII drawing).

**Sequence (serial at the ends, parallel in the middle):**

1. Human sets architecture and scope.
2. Orchestrator splits work into Engine / UI / Eval workstreams (these three may run in parallel; their write paths do not overlap).
3. Integration runs `npm run verify`.
4. On failure: return the log to the worker that owns the failing files, then verify again. On success: stop. Evidence is `acceptance.json` + `evals/traces/latest-eval.json`.

---

## 2. Worker Roles & Boundary Guarantees

Dev Day emphasizes that **agent count is not the goal** and penalizes arbitrary multi-agent chat networks. Every agent in this system has a concrete boundary and deterministic constraints:

### 1. Interview Engine Worker
- **Responsibilities:**
  - Implements the adaptive decision router (`FOLLOW_UP` vs `MOVE_ON`).
  - Enforces evaluation across 4 dimensions (`relevance`, `specificity`, `fundamentals`, `structure`).
  - Manages session state machine (maximum 2 follow-ups per question before forced `MOVE_ON`).
  - Implements prompt templates for candidate probing and feedback report generation.
- **Constraints / Fences:**
  - CANNOT modify `evals/holdouts/`.
  - CANNOT manually alter `acceptance.json` without passing verification.
  - Works with text only (audio is deferred per project scope).

### 2. Product UI Worker
- **Responsibilities:**
  - Implements the candidate interview flow in Next.js 16 App Router.
  - Implements the recruiter session configuration view.
  - Renders real-time interviewer questions, follow-ups, and the final scorecard.
  - Ensures all interactive elements contain explicit `data-testid` attributes.
  - Authors Playwright E2E test specifications.
- **Constraints / Fences:**
  - CANNOT declare a feature complete without green verification from the Integration Agent.
  - CANNOT introduce live LLM network calls directly inside client components.

### 3. Eval / Harness Worker
- **Responsibilities:**
  - Maintains frozen golden transcripts (`evals/goldens/`).
  - Manages private holdout evaluation fixtures (`evals/holdouts/`).
  - Maintains the harness verification runner (`scripts/verify-harness.ts`).
  - Maintains the default-fail `acceptance.json` registry.
  - Executes independent reviews and produces machine evaluation traces (`evals/traces/`).
- **Constraints / Fences:**
  - CANNOT write core product feature code. Its sole job is verification and truth-telling.

### 4. Integration Agent
- **Responsibilities:**
  - Merges workstreams from the three workers.
  - Runs the canonical gate command: `npm run verify`.
  - Parses failure logs and directs targeted feedback back to the failing worker.
  - Confirms `npm run verify` is green; does not keep a separate progress log.

---

## 3. Context Engineering Strategy

### Context Isolation
Rather than dumping all project files, test logs, and prompts into a single massive context window:
1. **Engine Worker** receives only: `SPEC.md`, `lib/harness/schema.ts`, and target prompt templates.
2. **UI Worker** receives only: App Router files (`app/`), styling rules, and component specifications.
3. **Eval Worker** receives only: fixture schemas, evaluation criteria, and runner scripts.
4. **Integration Agent** receives only git diffs and failure outputs.

### Compaction & Silence on Success
- Passing test logs are silenced: `npm run verify` prints single-line milestones (`✓ Golden [vague-specificity] passed`).
- When failures occur, only the failing assertion, diff, and file line are extracted and delivered to the fixing loop. This prevents context exhaustion and stops models from hallucinating false fixes.

### Durable Handoff on Disk
- `acceptance.json`: Default-fail criteria with verified trace pointers (written by `npm run harness` only).
- `evals/traces/latest-eval.json`: Last harness run.
- Git: the next session reads the repo.

---

## 4. Deterministic Controls vs. Agent Judgment

| Layer | Type | Responsibility | Why Deterministic |
|---|---|---|---|
| **Schema Validation** | Deterministic (Zod) | Output shape: `{ decision, reason, dimension, followUp }` | Models drift on syntax; parser failures are facts, not opinions |
| **Follow-up Cap** | Deterministic (State Machine) | Max 2 follow-ups per question | Avoids infinite follow-up loops on weak candidates |
| **Transcript Grounding** | Deterministic (Substring check) | Every feedback quote must exist verbatim in transcript | Prevents LLM evaluator from fabricating candidate quotes |
| **Golden Evals** | Deterministic (Frozen fixtures) | 6 failure mode fixtures + holdout | Verifiable invariants in CI with zero API cost |
| **Adaptive Probing** | Agent Judgment | Real-time question follow-up generation | Contextual evaluation of candidate nuance |

---

## 5. Parallel Workstreams & Coordination

```
TIME ─────────────────────────────────────────────────────────────►

Workstream 1 (Engine):   [Define Prompt & State]───►[Implement Router]──┐
                                                                         ▼
Workstream 2 (UI):       [Build Recruiter View]────►[Candidate UI]─────►[Integration Agent]──► [npm run verify]
                                                                         ▲
Workstream 3 (Harness):  [Create Goldens]──────────►[Holdout Fixtures]───┘
```

1. **Shared Contract First:** All 3 workstreams agree on `lib/harness/schema.ts` before branching.
2. **Independent Execution:**
   - UI Worker builds mock components using `DeterministicStubProvider`.
   - Engine Worker develops prompt logic against frozen JSON fixtures.
   - Eval Worker authors holdouts that neither worker can touch.
3. **Integration Point:** All 3 branches converge at `npm run verify`. If any golden fails or schema breaks, the Integration Agent halts progression.
