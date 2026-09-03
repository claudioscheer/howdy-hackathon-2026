# Howdy Interview Coach

> An adaptive mock interview platform that simulates real interview pressure, probes generic answers, and delivers structured, transcript-grounded feedback reports. Built for the **Howdy Dev Day 2026 Hackathon**.

---

## 1. Overview

Many qualified candidates fail technical and behavioral interviews not due to lack of competence, but due to interview failure modes:
- **Generic answers under pressure** (claims without concrete examples or tradeoffs).
- **Recency mismatch** (detailed stories from 6 years ago, surface-level claims on current stack).
- **Fundamentals gaps** hiding behind senior buzzwords.
- **Wandering or unstructured communication**.

**Howdy Interview Coach** simulates this pressure ahead of time:
1. Recruiter or candidate sets up a targeted practice session (Role, Seniority, Tech Stack, Interview Type).
2. The candidate responds via text or audio (transcribed to canonical text).
3. The interviewer agent makes real-time routing decisions after each turn:
   - **`MOVE_ON`** if the response is specific, relevant, and well-structured.
   - **`FOLLOW_UP`** if the answer was vague, evasive, or ungrounded.
4. An evaluator produces an actionable scorecard across 4 core dimensions with transcript-grounded citations.

---

## 2. The Four Evaluation Dimensions

| Dimension | What it evaluates |
|---|---|
| **Relevance** | Does the answer directly address the role and question, or drift into unrelated history? |
| **Specificity** | When pushed, does the candidate provide concrete metrics, incidents, and tradeoffs, or repeat generalities? |
| **Fundamentals** | When tested directly on basic role concepts, does the candidate demonstrate genuine technical depth? |
| **Structure** | Is the answer organized (e.g. STAR/CAR method) or rambling and hard to follow? |

---

## 3. Engineering & Verification Harness

Dev Day scores **Harness + Autonomous Loops at 25 points** (tied for first place).

In this system, verification is designed as a pyramid with mechanical backpressure:

```
                  ┌────────────────────────┐
                  │ Layer 3: LLM-as-Judge  │ (Advisor only - NEVER a gate)
                  ├────────────────────────┤
                  │ Layer 2: E2E Playwright│ (Gate - stubbed provider)
                  ├────────────────────────┤
                  │ Layer 1: Goldens/Evals │ (Gate - frozen transcripts)
                  ├────────────────────────┤
                  │ Layer 0: Contracts/CI  │ (Gate - typecheck, lint, test)
                  └────────────────────────┘
```

### Why LLM-as-a-Judge is NOT a Gate
As detailed in [`docs/HARNESS.md`](./docs/HARNESS.md), LLM-as-a-judge is deliberately excluded from CI and Stop hooks because:
- **Non-deterministic:** Variance in scores causes autonomous agent loops to thrash on noise.
- **Verbosity & Fluency Bias:** Judges reward longer prose even if basic facts are ungrounded.
- **Reward Hacking:** Autonomous optimizers learn to game judge rubrics rather than fixing real code.
- **Ground Truth Drift:** A judge can hallucinate that an ungrounded feedback note is valid.

Instead, deterministic checks (schema validation, substring grounding in transcripts, frozen golden fixtures) provide the ground-truth backpressure.

### The Canonical Gate Command
```bash
npm run verify
# or
pnpm verify
```
This executes:
1. `npm run build` — TypeScript strict typecheck & Next.js production compilation.
2. `npm run lint` — ESLint rules.
3. `npm run test` — Vitest unit and regression suites.

If any check fails, the process exits with a non-zero code. The agent inspects the error, repairs the code, and verifies again:
```
BUILD → VERIFY → OBSERVE → FIX → REPEAT
```

---

## 4. Quick Start

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm or pnpm

### Installation
```bash
npm install
# or
pnpm install
```

### Available Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Compile optimized production build with TypeScript checks |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit test suite |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run verify` | Run full harness gate (`build` + `lint` + `test`) |

---

## 5. Repository Structure

```
howdy-hackathon-2026/
├── app/                    # Next.js App Router (pages, layout, styles)
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/                 # Static assets
├── __tests__/              # Unit and component tests
│   └── page.test.tsx
├── docs/                   # Architectural notes & specs
│   └── HARNESS.md          # Verification harness philosophy & design
├── hackathon/              # Competition guidelines
│   └── howdy-2026-dev-day.md
├── AGENTS.md               # Context & guidelines for autonomous coding agents
├── CLAUDE.md               # Pointer to AGENTS.md for AI assistants
├── SPEC.md                 # Product specification & rubric
├── vitest.config.mts       # Vitest configuration
├── vitest.setup.ts         # Test environment setup
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. Related Documentation

- [`SPEC.md`](./SPEC.md): Complete product requirements, architecture, and definition of done.
- [`docs/HARNESS.md`](./docs/HARNESS.md): Deep-dive into verification tiers, flakiness mitigation, and autonomous loop design.
- [`hackathon/howdy-2026-dev-day.md`](./hackathon/howdy-2026-dev-day.md): Official Dev Day 2026 Competition Outline and scoring criteria.
- [`AGENTS.md`](./AGENTS.md): Operational instructions for autonomous agent coding.
