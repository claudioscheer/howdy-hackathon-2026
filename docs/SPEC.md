# Product specification — Howdy Interview Coach

## Objective

Give candidates a realistic, fictional practice interview before a real one.
The product should detect weak interview behavior and apply useful pressure rather
than asking a static list of generated questions.

The memorable behavior is:

> It does not just ask interview questions. It notices when you are getting away
> with a bad answer.

The product currently has a landing page, a Prisma/Postgres manager flow, saved
and generated interview plans, a candidate practice route, the adaptive loop,
and a verification harness. Grounded feedback and retry comparison remain the
next unshipped product milestones.

## Core user journey

1. An engineering manager enters the seeded demo portal (`/login`) and selects a
   fictional opportunity with a candidate practice link. This is not production
   authentication. Opportunity and candidate configuration is stored in Postgres.
2. The candidate opens the shareable practice link (`/practice/[sessionId]`)
   directly without requiring an account or login.
3. The candidate completes planned questions in text within the allowed 2-attempt
   trial window.
4. The system evaluates the answer using the opportunity, question intent, and
   transcript history, deterministically triggering `FOLLOW_UP` or `MOVE_ON`.
5. The loop continues until the configured questions are complete.
6. The candidate receives a report grounded in exact transcript excerpts and can
   export their scorecard results.
7. The canonical hackathon policy is exactly two attempts. Persistence, link
   security, and TTL enforcement are deferred; seeded UI copy may preview that
   future policy but must not claim it is enforced in this milestone.

## Required behavior

### Session configuration (Engineering Manager)

- Manager access (`/login`): a seeded demo entry into fictional opportunities;
  it is explicitly not production authentication.
- Candidate route: active seeded opportunities open `/practice/[sessionId]`.
- Candidate zero-auth: Candidates never log in; their access is strictly link-driven
  and disposable.
- Exportable candidate reports: Candidates can export their grounded feedback
  report upon completing the session.
- Candidate progress scope: Cross-opportunity progress tracking is intentionally
  dismissed for candidates because practice sessions are disposable preparation for
  specific roles. Consolidated tracking is reserved for manager review in future phases.

### Adaptive interview

The primary loop is:

```text
ASK → ANSWER → EVALUATE
                 ├─ sufficient → MOVE_ON
                 └─ weak       → FOLLOW_UP → EVALUATE AGAIN
```

The evaluator should detect:

- vague or generic answers;
- failure to become specific after a follow-up;
- old or irrelevant experience presented instead of recent evidence;
- fundamentals gaps exposed by direct questions;
- rambling or poorly structured communication; and
- answers that do not address the question.

Application policy caps follow-ups at two per question and enforces the session
answer budget, per-topic answer budget, and core-opening reservation. The model
may recommend another follow-up, but it cannot override that cap or other
session policy. v1 is turn-only: remaining interview minutes are not a runtime
input. A weak answer does not justify another follow-up if that would exhaust
the session or topic answer budget or crowd out a remaining core.

### Feedback report

Every completed session reports on:

| Dimension                   | Meaning                                                   |
| --------------------------- | --------------------------------------------------------- |
| Relevance                   | The answer addressed the actual question and opportunity. |
| Specificity under follow-up | The candidate supplied concrete evidence when pushed.     |
| Fundamentals                | Direct, role-relevant fundamentals held up.               |
| Communication structure     | The response was organized and understandable.            |

Each dimension is either scored 1–5 or marked `insufficient_evidence` when the
session never gathered enough signal. A time-boxed answer can still contribute
observed evidence; unknown remaining material is named instead of scored as
weakness. Every quoted evidence item must be an exact non-empty substring of the
candidate transcript.

### Retry and comparison

- Exactly two attempts are supported per disposable candidate link.
- Persistence and automatic link expiration are deferred from the current milestone.
- Planning receives the questions used in earlier attempts.
- The comparison contrasts the second attempt with the first report.

## Product runtime architecture

Runtime AI responsibilities are model-backed components, not a multi-agent
framework:

```text
Opportunity + attempt history
            ↓
      QuestionPlanner
            ↓
   deterministic SessionReducer
            ↓
      AnswerEvaluator
            ↓
FOLLOW_UP / MOVE_ON policy
            ↓
 ReportEvaluator / ReportBuilder
```

- `QuestionPlanner` proposes structured questions for the opportunity and avoids
  used questions.
- `AnswerEvaluator` returns a structured decision, reason, dimension when weak,
  and follow-up wording when needed. v1 judgments use the question, brief,
  answer, transcript history, and turn budgets. Elapsed-time inputs are an
  explicit later decision, not part of this freeze.
- `SessionReducer` owns question index, follow-up count, answer budgets,
  transcript history, completed questions, question outcomes, attempt number,
  used questions, and completion state.
- `ReportEvaluator` proposes the four-dimension report.
- Deterministic report validation rejects fabricated transcript quotes.

The public schemas and state-machine event boundary live in
`lib/interview/contracts.ts` and `lib/interview/session.ts`. Model adapters return
untrusted values; application services must parse them with Zod before dispatching
state events.

## Agentic engineering system

The system used to build this product is separate from the runtime above. Coding
agents may work in Engine, UI, and Evaluation contexts after the public contracts
are stable. Their outputs integrate through `pnpm run verify` and browser
verification. See `SYSTEM.md` for ownership, context, and evidence rules.

## Constraints and non-goals

- All repository, evaluation, and demo data must be fictional or seeded.
- The build must remain achievable within hackathon hours.
- Typed answers are the only required input mode.
- Audio recording/transcription is optional and deferred.
- Production authentication is deferred. `/login` is only a seeded demo entry for
  the manager-side story; candidates do not authenticate.
- Email delivery, live Howdy integrations/data, and whiteboarding are deferred.
  Manager opportunity/candidate configuration is stored in Postgres via Prisma.
  Interview transcripts, attempt enforcement, and production authentication stay
  deferred.
- No live model call may run in `pnpm run verify` or CI.
- This is interview-performance coaching, not production candidate vetting.

## Implementation approach

1. Establish runtime schemas, deterministic state events, truthful acceptance,
   and a reproducible verification gate.
2. Build one seeded vertical slice: configuration, typed interview, adaptive
   decision, and grounded report.
3. Add multi-turn behavioral scenarios and browser verification around that
   slice.
4. Add one retry/comparison path, live model adapters, polish, and deployment.

Important behavior ships with its regression lock. Ordinary logic uses colocated
unit tests; interview judgment uses synthetic goldens and independent holdouts;
the user journey uses browser tests.

## Definition of done

- [ ] A fictional opportunity/session can be opened from a shareable-looking demo
      route.
- [ ] A candidate can complete a typed interview end to end.
- [ ] A weak answer visibly triggers an appropriate follow-up.
- [ ] A sufficient answer advances to the next planned question.
- [ ] Deterministic state owns all transitions and enforces the follow-up cap.
- [ ] The final report covers all four dimensions as scored or
      insufficient-evidence, with validated transcript evidence.
- [ ] One retry varies questions and compares against the previous attempt.
- [ ] `pnpm install` and `pnpm run verify` pass locally and in GitHub Actions on the
      documented Node version.
- [ ] The repository contains authentic orchestration and autonomous recovery
      evidence from development.
- [ ] The application is deployed and the three-minute demo story is rehearsable.

Audio and production authentication are explicitly dismissed from the definition
of done. Access is seeded and link-driven to prioritize the core interview and
coaching features.

## Interview plan freeze (2026-09-09)

This freeze is the contract for the next implementation slices. It does not
change the product evaluator to a live model in this milestone.

### Agenda

Pilot target is close to 40 minutes. Minutes describe the agenda for managers.
Turns enforce the budget at runtime. The number of scored questions is not
fixed: it follows the opportunity (role, seniority, job description, and what
must be learned) and the time those topics can take. Prefer fewer deeper
questions over many shallow ones. A finished interview is not padded to fill
time.

Typical parts, when the opportunity needs them:

| Part                            | Notes                                                   |
| ------------------------------- | ------------------------------------------------------- |
| Introduction and warm-up        | Canned format explanation. Not scored. About 3 minutes. |
| Recent project ownership        | Often `core` when recent focus matters.                 |
| Highest-signal role competency  | `core`.                                                 |
| Another distinct competency     | `core` or `supporting` only if the role needs it.       |
| Collaboration or judgment       | Often `supporting`; droppable under schedule pressure.  |
| Candidate questions and closing | Canned close. Not scored. About 4 minutes.              |

Topics adapt to `interviewType`. A system-design interview is one core scenario.
Supporting probes inside that scenario are follow-ups on the same question and
share the same two-follow-up cap. That interview may finish well before 40
minutes.

Default session answer budget is 10 candidate submissions. Every candidate
submission, including follow-up answers, consumes one unit.
`topic_budget_exhausted` is defined against the per-question answer budget, not
a wall clock. `timeBudgetMinutes` stays on the brief for planning and review.

### Interviewer brief

Each question may include a brief:

- competency and role relevance (what we assess, distinct from rubric
  dimensions);
- importance: `core` / `supporting` / `optional`;
- expected depth for this seniority;
- evidence to listen for;
- follow-up triggers (kinds, not canned sentences);
- time budget, answer budget, and follow-up limit (v1 cap remains 2);
- stopping criteria.

Prompt-only saved records remain valid for the basic question flow. Briefed
evaluation is enabled only when every question has a complete brief. The product
must not invent assessment criteria from a prompt.

### Follow-ups

Plan the triggers. Write the follow-up live from transcript evidence.

The evaluator returns `FOLLOW_UP` or `MOVE_ON`. A follow-up cites transcript
quotes, names the unresolved gap, and names a probe purpose: `diagnosis`,
`ownership`, `tradeoff`, `consequence`, `contradiction`, `close`, `relevance`,
or `clarification`. Contradiction cites both statements. Off-topic answers
recover through `relevance` or `clarification`. Evidence `supports` text must
explain the judgment; an exact quote alone is not enough. Quotes must still be
substrings of the transcript.

Ask one thing. Do not praise, hint, or coach in the live turn.

### Remaining time (later decision)

v1 runtime budgets are turn counts: the session answer budget, per-question
answer budget, and follow-up cap. `targetMinutes` and `timeBudgetMinutes` are
planning and review fields for a close-to-40-minute agenda. They are not a
second runtime clock.

Adding elapsed-time inputs to live `FOLLOW_UP` / `MOVE_ON` judgments is an
explicit later decision. Do not introduce that system in this freeze.

### Policy versus model stop

The model may recommend `evidence_sufficient`, `no_new_information`, or
`candidate_cannot_go_deeper`. The reducer owns `follow_up_cap`,
`topic_budget_exhausted`, and `protect_remaining_core_or_close`. Persist both
the recommendation and the applied outcome. A forced advance is never stored as
a satisfactory answer.

The candidate may stop from `AWAITING_ANSWER` with
`{ type: "END_SESSION", reason: "candidate_ended" }`. Remaining questions,
including the current unanswered or in-progress topic, receive
`appliedStopReason: "candidate_ended_early"` and the session enters
`GENERATING_REPORT`. That is not a skip of a core and is never stored as a
satisfactory answer. Elapsed practice time is a client pacing hint against
`targetMinutes`; it is not a `FOLLOW_UP` / `MOVE_ON` input.

Skipping: drop `optional` first, then `supporting`. Never skip a `core`. Reserve
one initial answer for every remaining core (in the basic path, every remaining
question). An early topic cannot consume another core's first opportunity.

Within the two-follow-up ceiling, move on when evidence is sufficient, probing
adds nothing, the candidate cannot go deeper, the topic answer budget is gone,
or continuing would crowd out a remaining core or the close.

### Named regression

`evals/goldens/irrelevant-react-on-conflict.json` locks the case where “I used
React for six months on a personal project” is asked after a teammate-
disagreement question and must `FOLLOW_UP` on `relevance`. The paraphrased
negative (adding “with a teammate”) is locked with it. Recovery on the
follow-up is checked by the independent holdout
`evals/holdouts/conflict-follow-up-recovery.json`, and
`evals/goldens/api-topic-isolated-from-conflict.json` locks that a later
question is not judged against the conflict topic.

### Implementation order

1. Wire saved plans into the candidate session (prompt-only is enough for the
   basic flow).
2. Persist and review interviewer briefs; require brief completion before the
   briefed evaluation path.
3. Replace the product evaluator with a brief-aware, transcript-grounded
   decision under these timing rules.
4. Report stop reasons and insufficient-evidence dimensions.

`pnpm run verify` stays keyless. A live OpenCode interviewer may run in the
product when credentials are present; the merge gate and Playwright journey
keep using the scripted evaluator. Live-model conversation review stays off
the merge gate.

Completing the last askable question, or ending early, enters
`GENERATING_REPORT`. `COMPLETE` happens only after `REPORT_GENERATED`.
