<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Howdy Interview Coach — Agent Operating Guidelines & Guardrails

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS:**  
> Read this file in full before performing any work. You must stay strictly within defined scope boundaries and NEVER bypass the verification harness.

---

## 1. Project Context & Objectives

**Howdy Interview Coach** is an adaptive mock interview platform built for the **Howdy Dev Day 2026 Hackathon**.

### The Problem
Qualified candidates fail interviews due to behavioral & technical execution gaps:
1. Answers remain generic and lack concrete incidents or tradeoffs under pressure.
2. Recency mismatch (elaborating on work from 6 years ago instead of current stack).
3. Fundamentals gaps disguised by senior buzzwords.
4. Unstructured or wandering communication.

### The Solution
A real-time adaptive mock interviewer that evaluates candidate responses turn-by-turn:
- **`MOVE_ON`**: Candidate gave a concrete, relevant, and well-structured answer.
- **`FOLLOW_UP`**: Candidate was vague, evasive, or drifted off-topic.
- Probes across 4 core dimensions: `relevance`, `specificity`, `fundamentals`, `structure`.
- Delivers an end-of-session feedback report grounded verbatim in the candidate transcript.

---

## 2. Hard Scope Fences (DO NOT DEVIATE)

To keep implementation focused and prevent models from hallucinating unneeded features:

- ❌ **NO AUDIO RECORDING OR WEBRTC:** Text answers are the canonical format. Audio is explicitly a future "nice-to-have" (per team alignment). Do NOT build audio recorders, speech-to-text APIs, WebRTC, or media servers.
- ❌ **NO DIAGRAMMING / WHITEBOARDS:** System design questions are evaluated strictly through conversational text description and reasoning. Do NOT build canvas or drawing tools.
- ❌ **NO EXTERNAL LIVE LLM CALLS IN CI:** All automated verification suites and e2e flows MUST use deterministic stub providers (`DeterministicStubProvider`). Live model evaluations are separate, off-critical-path benchmarks.
- ❌ **NO FAKE CITATIONS:** Feedback notes MUST cite exact verbatim substrings from the candidate's transcript. The Layer 0 grounding validator rejects fabricated quotes.
- ❌ **NO OVER-COMPLEX MULTI-AGENT CHAT NETWORKS:** We do not spawn arbitrary conversational agents. Work is partitioned cleanly across distinct workers (see §3).

---

## 3. Worker Architecture & Ownership Boundaries

Work is divided into 3 specialized roles, coordinated by an Orchestrator and verified by an Integration Agent:

```
                         HUMAN (Claudio / Matheus)
                                    │
                           architecture / scope cuts
                                    │
                                    ▼
                         ORCHESTRATOR AGENT
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
       ▼                            ▼                            ▼
 Interview Engine Worker       Product UI Worker          Eval / Harness Worker
 (Prompts, schema, state)      (Next.js App, UI, a11y)    (Goldens, holdouts, trace runner)
       │                            │                            │
       └────────────────────────────┬────────────────────────────┘
                                    ▼
                          INTEGRATION AGENT
                                    │
                                    ▼
                          FULL VERIFICATION GATE
                          (`npm run verify`)
                                    │
                         failures? ─┴─ yes ──┐
                                  ▲           │
                                  └───────────┘
                                        │ no
                                        ▼
                                 READY TO SHIP
```

### Worker Boundary Rules
| Worker | Owns | FORBIDDEN From Modifying |
|---|---|---|
| **Interview Engine Worker** | Prompt templates, state machine (`lib/harness/schema.ts`), question router, scoring logic | `evals/holdouts/`, manual flips of `acceptance.json` |
| **Product UI Worker** | App Router pages (`app/`), components, interactive UI, styling, `data-testid` attributes | Declaring features done without harness verification |
| **Eval / Harness Worker** | Golden fixtures (`evals/goldens/`), holdouts (`evals/holdouts/`), harness runner, acceptance registry | Implementing core product features |
| **Integration Agent** | Running `npm run verify`, regression checking, handoff logging in `PROGRESS.md` | Editing code without failing test context |

---

## 4. The Verification Harness (The Gate)

Dev Day scores **Harness + Autonomous Loops at 25 points** (tied for highest).
Agents must operate autonomously:
```
BUILD → VERIFY → OBSERVE → FIX → REPEAT
```

### Canonical Gate Command
```bash
npm run verify
# or
pnpm verify
```
This single command runs:
1. `npm run build` (Next.js production build & TypeScript typecheck)
2. `npm run lint` (ESLint checks)
3. `npm run test` (Vitest unit and contract tests)
4. `npm run harness` (Golden fixtures and acceptance evaluation)

**RULE:** An agent must NEVER claim work is complete if `npm run verify` exits with a non-zero code.

### Verification Pyramid
- **Layer 0 (Deterministic Contracts - GATE):**
  - TypeScript strict typing.
  - Decision schema: `{ decision, reason, dimension?, followUp? }`. When `FOLLOW_UP`, `followUp` string and `dimension` are strictly required.
  - State machine policy: Maximum 2 follow-ups per question; on 3rd weak answer, force `MOVE_ON`.
  - Substring grounding: All feedback quotes must be verbatim substrings in transcript.
- **Layer 1 (Golden Transcripts - GATE):**
  - Frozen fixtures in `evals/goldens/` covering all 4 dimensions, concrete answers, and cap limits.
  - Holdout fixtures in `evals/holdouts/` to prevent prompt/router overfitting.
- **Layer 2 (Browser / E2E - GATE):**
  - Headless Playwright tests using deterministic stub providers.
- **Layer 3 (LLM-as-a-Judge - ADVISOR ONLY):**
  - Never a gate or stop-hook. LLM-as-judge is non-deterministic, biased toward verbosity, vulnerable to reward hacking, and slow. It cannot override failed contracts or goldens.
- **Layer 4 (Default-Fail Acceptance - GATE):**
  - Criteria in `acceptance.json` start with `"passes": false`. They can only flip to `true` when verified machine evidence is produced in `evals/traces/`.

---

## 5. Coding & UI Conventions

- **Next.js 16 (App Router):** Use standard React Server Components where possible, `"use client"` only where local state/interaction is required.
- **Styling:** Tailwind CSS v4.
- **Testing:** Vitest + Testing Library.
- **Testability Requirement:** Every interactive element (buttons, inputs, status badges, scorecards, question cards) MUST include a clear `data-testid` attribute (e.g. `data-testid="submit-answer-btn"`).
- **Context Efficiency:** Do not dump massive passing logs into agent prompts. Report only failing assertions and exact lines.

---

## 6. Autonomous Recovery Protocol

When verification fails during an agent run:
1. **Read the exact error:** Identify whether it is a type failure, schema violation, failed golden fixture, or ungrounded transcript quote.
2. **Formulate a hypothesis:** Diagnose the root cause in code or state logic.
3. **Apply a minimal, targeted fix:** Do not rewrite unrelated components.
4. **Rerun verification:** Execute `npm run verify` to confirm the fix works.
5. **Log evidence:** Update `PROGRESS.md` and `docs/AI-DEV-LOG.md`.
