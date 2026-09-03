# SPEC.md — Howdy Interview Coach

## 1. Objective

Give Howdy candidates a realistic practice interview before their real one, so they walk in prepared instead of finding out what they should have said only after they're rejected.

Many candidates who are technically qualified still lose interviews for reasons that have nothing to do with whether they can do the job — they ramble in their introduction, give vague answers when asked to get specific, lean on old experience instead of describing their current work, or lose structure under follow-up pressure. These are learnable, fixable habits. A short practice run with honest feedback beforehand can meaningfully change the outcome of a real interview.

Howdy Interview Coach is a small, working tool that simulates that pressure ahead of time: it interviews the candidate the way a real client interviewer would, pushes back when an answer is too generic, and hands back a specific, actionable report at the end.

## 2. Problem Statement

Across technical hiring generally, a recurring set of failure patterns shows up again and again in interview feedback, independent of the specific role or company:

- **Answers stay generic under pressure.** When asked to get specific, the candidate repeats the same high-level claim instead of giving a concrete example.
- **Recency mismatch.** A candidate's strongest, most detailed story is from years ago; recent work is described in one-liners with no depth — a red flag for a role that assumes current, hands-on skill.
- **Fundamentals gaps hiding behind seniority language.** A candidate describes themselves as senior/full-stack but stumbles on basics (a simple query, a core protocol concept) the moment they're tested directly.
- **Weak communication structure**, independent of technical skill — rambling, answering a different question than the one asked, or losing the thread when explaining something to someone less familiar with the topic.
- **Visible lack of preparation** — generic answers that show the candidate didn't think specifically about the role or company they're interviewing for.

None of these are about whether the candidate can do the job. They're about interview performance, and interview performance is something a candidate can practice and improve if someone tells them, specifically, what went wrong.

## 3. Goals / Non-Goals

**Goals**

- Let a recruiter or ops team member set up a practice interview for a candidate against a specific opportunity (role, seniority, tech stack, interview type).
- Let the candidate run through a realistic mock interview on their own time, before the real one.
- Give the candidate a specific, honest report at the end — not just a score, but what to actually change.
- Let the candidate retry a few times with varied questions, so they're practicing the skill, not memorizing answers.

**Non-Goals** (explicitly out of scope for this build)

- Not a replacement for actual technical vetting or skill assessment.
- Not solving rate/compensation mismatches — those are a screening problem, not an interview-performance problem.
- Not building a whiteboard/diagram tool for system design (see §6).
- Not integrating with any live production system, candidate data, or real client information. All data used in the build and demo is fictional/seeded.

## 4. Functional Requirements

1. **Session setup** — a recruiter/ops user creates a mock interview session by specifying:
   - Candidate (name/identifier)
   - Opportunity profile: role, seniority level, key skills/tech stack
   - Interview type: introduction/behavioral, technical, or system design
     The candidate receives a link to start the session whenever they're ready.

2. **Answering** — the candidate can respond to each question either by typing or by recording audio. Recorded audio is transcribed to text before anything else happens, so the rest of the system only ever deals with text. The candidate never has to decide which mode is "correct" — both are always available.

3. **Adaptive interviewing** — the mock interviewer does not just fire down a fixed list of questions. After each answer, it decides in real time whether to:
   - move on (the answer was specific and relevant), or
   - follow up and push (the answer was vague, generic, off-topic, or leaned on old/irrelevant experience) — the same way a real interviewer would say "can you get more specific?" or "how does that relate to this role?"

4. **System design without a whiteboard** — system design questions are asked and answered conversationally: "walk me through your approach," "what happens at 10x the load," "what trade-off are you making there?" The candidate's answer (typed or spoken description) is evaluated the same way as any other answer. No drawing/diagramming tool is required.

5. **Feedback report** — at the end of a session, the candidate gets:
   - A scorecard across a small set of dimensions (see §6 rubric)
   - Specific written notes tied to what actually happened in _their_ session (e.g., "you spent the first 90 seconds of your introduction on work unrelated to this role before mentioning anything relevant")

6. **Retries** — the candidate can run the same mock interview again, 2–3 times. Each retry generates a varied set of questions rather than repeating the same ones, and the report shows how this attempt compares to the last.

## 5. Non-Functional Requirements / Constraints

- Must be small enough to build and demo within a single hackathon session (hours, not days).
- Must run against seeded/sample data only — no live production systems or real candidate/employer data.
- All example content (companies, roles, candidates) used anywhere in the build, docs, or demo must be fictional.

## 6. Evaluation Rubric

Every answer, and the session as a whole, is scored against four dimensions derived from the problem statement in §2:

| Dimension                       | What it's checking                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Relevance**                   | Does the answer connect directly to the role/opportunity, or does it drift into unrelated history? |
| **Specificity under follow-up** | When pushed, does the candidate give a concrete example, or repeat the same generic claim?         |
| **Fundamentals**                | When tested directly on a basic, role-relevant concept, does the candidate hold up?                |
| **Communication structure**     | Is the answer organized and on-topic, or does it wander / answer a different question than asked?  |

## 7. Proposed Architecture

The system is organized as a small set of agents plus one deterministic step, coordinated by an orchestrator:

```
Recruiter Setup ──▶ Session Config (candidate + opportunity + interview type)
                              │
                              ▼
                 ┌─────────────────────────┐
                 │  Question Plan Agent     │  builds the question set for this
                 │                          │  opportunity/interview type
                 └────────────┬─────────────┘
                              │  (runs in parallel with)
                 ┌────────────┴─────────────┐
                 │  Role Context Agent       │  expands on what's typically
                 │                           │  probed for this seniority/stack
                 └────────────┬─────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │  Interview Orchestrator  │◀── candidate answer (typed or
                 │  (mock interviewer)      │     audio → transcribed to text,
                 │  decides: follow up      │     deterministic step, no
                 │  or move on              │     agent judgment involved)
                 └────────────┬─────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │  Evaluator Agent         │  scores each answer + full
                 │                          │  session against the §6 rubric,
                 │                          │  writes the feedback report
                 └────────────┬─────────────┘
                              ▼
                      Feedback Report ──▶ Candidate
                              │
                    (on retry, feeds "avoid repeating
                     these questions" back into the
                     Question Plan Agent)
```

**Data model (minimal):**

- `sessions` — candidate, opportunity profile, interview type, attempt number
- `questions` — per session, with type (intro/technical/system-design) and follow-up chain
- `answers` — text (audio answers store a transcript; raw audio is not required downstream)
- `evaluations` — per-answer and per-session scores + written notes

## 8. Major Technical Decisions

- **Text is the canonical format.** Audio is transcribed immediately on submission so every downstream step (follow-up decisions, scoring, reporting) works on text only. This keeps the evaluation logic single-path regardless of how the candidate chose to answer.
- **Follow-ups are decided live, not scripted.** Whether to push on an answer is a judgment call made per-answer, not a fixed decision tree. This is what makes the mock interview feel adaptive instead of a static quiz — and it's also the system's main autonomous loop: act (ask) → verify (judge the answer) → observe a problem (vague/off-topic) → follow up → verify again.
- **No diagramming tool for system design.** Real system design interviews are judged mostly on verbal/written reasoning, not drawing quality — so a text or spoken description is fully sufficient input for evaluation, and it keeps the build small.
- **Question variation on retries is prompt-driven, not a static bank.** Rather than maintaining a large pre-written question set, the Question Plan Agent is told which questions were already used and asked to generate new ones — simpler to build and inherently produces variety.

## 9. Definition of Done

- [ ] A recruiter can configure a session for a fictional candidate + opportunity and get a shareable link.
- [ ] A candidate can complete a full mock interview end-to-end using either typed or recorded answers.
- [ ] During at least one demo run, the interviewer visibly follows up on a vague/generic answer instead of moving straight to the next question.
- [ ] The candidate receives a feedback report with a scorecard (§6) and specific, transcript-grounded notes.
- [ ] A second attempt at the same mock interview produces a different set of questions and a comparison against the first attempt's scores.
