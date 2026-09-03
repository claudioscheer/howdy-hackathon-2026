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

These are **roles**, not a requirement to spawn four named chat sessions. One agent may play one role per workstream. Do not invent extra agent personas.

### Order of work

1. **Human** sets architecture and scope (what is in / out). Do not expand scope.
2. **Orchestrator** splits work into at most three parallel workstreams and names the owner of each. It does not implement features.
3. **Workers** implement only inside their file list (below). They may run in parallel because their files do not overlap.
4. **Integration** runs `npm run verify` after workers finish (or when merging). It does not rewrite product code to “make tests pass” by weakening goldens.
5. If verify **fails**: send the failing log back to the worker that owns those files. That worker fixes. Integration runs verify again. Repeat until green. Do not skip this loop.
6. If verify **passes**: the workstream is done. Do not also maintain a separate progress file.

### Who owns which files

Stay in your column. If a change needs another column, stop and hand off — do not edit across the boundary.

| Role | You may edit | You must not edit | You are done when |
|---|---|---|---|
| **Interview Engine** | `lib/harness/schema.ts`, `lib/harness/engine.ts`, future `lib/engine/` prompts | `evals/holdouts/`, `acceptance.json` by hand, `app/` UI | Schema/engine tests pass; you have **not** touched holdouts |
| **Product UI** | `app/`, `lib/ui/`, `__tests__/page.test.tsx`, styles, `data-testid`s | `evals/`, `lib/harness/`, `scripts/verify-harness.ts`, `acceptance.json` | Page tests pass; you have **not** declared the product done |
| **Eval / Harness** | `evals/goldens/`, `evals/holdouts/`, `scripts/verify.sh`, `scripts/verify-harness.ts`, `__tests__/harness/` | `app/`, product feature code in `lib/engine/` (when it exists) | Goldens/holdouts still fail if the engine is wrong; you have **not** shipped UI |
| **Integration** | `docs/AI-DEV-LOG.md` (one loop example for Dev Day, only when the loop actually ran) | Product logic, goldens, holdouts, UI — unless a verify failure names a one-line typo you introduced while merging | `npm run verify` exits 0 |

`acceptance.json` is written **only** by `npm run harness` from evidence. Never set `"passes": true` by hand.

### Parallelism (why three workers)

Engine, UI, and Eval can run at the same time because they do not share write paths. Integration is **serial** and runs after those three. That is the only orchestration that matters.

### Current phase (overrides the table)

Interview setup / live session / report UI are **out of scope**. Engine worker: keep stub + schema, do not build a live LLM adapter yet. UI worker: landing page only. Eval worker: keep goldens and `verify`. Do not implement `SPEC.md` flows until a human says to.

---

## 4. The Verification Harness (The Gate)

Dev Day scores **Harness + Autonomous Loops at 25 points** (tied for highest).
Agents must operate autonomously:
```
BUILD → VERIFY → OBSERVE → FIX → REPEAT
```

### Current phase
The interview product (setup, live session, report UI) is **not in scope yet**. Do not implement SPEC flows. The landing page and harness are the test bed. Small UI changes must keep `__tests__/page.test.tsx` green.

### Canonical Gate Command
```bash
npm run verify
```
Runs `scripts/verify.sh` (silent on success, full log on failure, exit 2 on fail):
1. `npm run build`
2. `npm run lint`
3. `npm run test`
4. `npm run harness`

Claude Code **Stop** hook runs `npm test` only (fast). Claiming done still requires `npm run verify`.

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
- **Layer 2 (Browser / E2E):**
  - Not wired yet. Do not add Playwright until the interview UI exists. Landing regressions are caught by Vitest + Testing Library.
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
5. **Stop.** Green `npm run verify` is the evidence. Add a short note to `docs/AI-DEV-LOG.md` only when you closed a full ACT → VERIFY → FIX → VERIFY loop for the submission.
