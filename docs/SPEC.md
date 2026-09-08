# Product specification — Howdy Interview Coach

## Objective

Give candidates a realistic, fictional practice interview before a real one.
The product should detect weak interview behavior and apply useful pressure rather
than asking a static list of generated questions.

The memorable behavior is:

> It does not just ask interview questions. It notices when you are getting away
> with a bad answer.

The product currently has a landing page, seeded manager-entry/dashboard facade,
runtime contracts, and a verification harness. The candidate practice route and
end-to-end adaptive loop are the current milestone.

## Core user journey

1. An engineering manager enters the seeded demo portal (`/login`) and selects a
   fictional opportunity with a candidate practice link. This is not production
   authentication or persisted opportunity configuration.
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
- Production authentication is deferred. `/login` is only a seeded demo entry for
  the manager-side story; candidates do not authenticate.
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

Audio and production authentication are explicitly dismissed from the definition
of done. Access is seeded and link-driven to prioritize the core interview and
coaching features.
