# Product specification — Howdy Interview Coach

## Objective

Give candidates a realistic, fictional practice interview before a real one.
The product should detect weak interview behavior and apply useful pressure rather
than asking a static list of generated questions.

The memorable behavior is:

> It does not just ask interview questions. It notices when you are getting away
> with a bad answer.

The product is currently in its foundation phase. Runtime contracts and the
verification harness exist; the end-to-end interview experience does not yet.

## Core user journey

1. An engineering manager (EM) logs in via the manager portal (`/login`) to
   configure a role opportunity and generate a disposable candidate practice link
   governed by the expiration rule: exactly two attempts max and a one-week (7 days) TTL.
2. The candidate opens the shareable practice link (`/practice/[sessionId]`)
   directly without requiring an account or login.
3. The candidate completes planned questions in text within the allowed 2-attempt
   trial window.
4. The system evaluates the answer using the opportunity, question intent, and
   transcript history, deterministically triggering `FOLLOW_UP` or `MOVE_ON`.
5. The loop continues until the configured questions are complete.
6. The candidate receives a report grounded in exact transcript excerpts and can
   export their scorecard results.
7. Candidate link expiration: the practice link automatically expires after two
   attempts or after one week (7 calendar days), whichever comes first. Once
   expired, candidate access is permanently revoked. Candidates do not maintain
   persistent cross-opportunity progress profiles since practice opportunities are
   role-specific and disposable; session outcomes remain accessible to the
   engineering manager.

## Required behavior

### Session configuration (Engineering Manager)

- Manager access (`/login`): Engineering managers enter to configure fictional
  opportunities, interview rubrics, and candidate access links.
- Link generation: Produces tokenized, shareable candidate session routes
  (e.g. `/practice/[sessionId]`) with an explicit expiration policy: exactly two
  attempts max and a one-week (7 days) TTL, after which the link automatically
  expires.
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

Application policy caps follow-ups at two per question. The model may recommend
another follow-up, but it cannot override that cap or other session policy.

### Feedback report

Every completed session reports on:

| Dimension                   | Meaning                                                   |
| --------------------------- | --------------------------------------------------------- |
| Relevance                   | The answer addressed the actual question and opportunity. |
| Specificity under follow-up | The candidate supplied concrete evidence when pushed.     |
| Fundamentals                | Direct, role-relevant fundamentals held up.               |
| Communication structure     | The response was organized and understandable.            |

Each dimension has a score, concise guidance, and zero or more evidence items.
Every quoted evidence item must be an exact non-empty substring of the candidate
transcript.

### Retry and comparison

- Exactly two attempts are supported per disposable candidate link.
- Links expire automatically after two attempts or after one week (7 calendar days).
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
  and follow-up wording when needed.
- `SessionReducer` owns question index, follow-up count, transcript history,
  completed questions, attempt number, used questions, and completion state.
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
- Authentication and login are intentionally dismissed for this phase; engineering
  focus remains entirely on validating core feature capabilities (adaptive
  questioning, back pressure, and transcript-grounded coaching) without auth friction.
- Email delivery, Postgres, ORM/migrations, live Howdy integrations/data, and
  whiteboarding are deferred.
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
- [ ] The final report covers all four dimensions with validated transcript
      evidence.
- [ ] One retry varies questions and compares against the previous attempt.
- [ ] `pnpm install` and `pnpm run verify` pass locally and in GitHub Actions on the
      documented Node version.
- [ ] The repository contains authentic orchestration and autonomous recovery
      evidence from development.
- [ ] The application is deployed and the three-minute demo story is rehearsable.

Audio and user authentication/login are explicitly dismissed from the definition
of done. Access is open and link-driven to prioritize verifying core interview and
coaching features.
