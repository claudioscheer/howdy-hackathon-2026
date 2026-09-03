# Harness

We need a check an agent can run, trust, and loop on. `npm run verify` is that check. If it is green, the work can stop. If it is red, the agent must fix the named failure — not ask a human what went wrong.

Dev Day scores this at 25 points. A green suite that lies is worse than no suite: the agent stops and a vague answer still gets `MOVE_ON`.

## What verify does

1. **Prettier** — formatting is not optional.
2. **Build / types / lint** — compiles; no `any` / `as unknown` / `as never`; files stay small.
3. **Unit tests next to source, 100% coverage** on `app/page.tsx` and `lib/`.
4. **`evals/` goldens, holdouts, and canaries** — frozen (question, answer) → expected `FOLLOW_UP` or `MOVE_ON`.
5. **Deterministic review** — suite health, holdout independence, colocated tests for changed `app/` and `lib/` files. Not an LLM.
6. **Write `acceptance.json` and `evals/traces/latest-eval.json`** from that run. Each criterion is proven independently. Do not flip `passes` by hand.

Success is one line per stage. Failure dumps only the error. That keeps the agent’s context small.

## Why `evals/` exists

The interesting bug is not “the button clicked.” It is “the interviewer let a generic answer through.” A normal web test will not catch that.

Each file in `evals/goldens/` is a fixture: vague claim → `FOLLOW_UP` / `specificity`; old-job story → `FOLLOW_UP` / `relevance`; concrete metric → `MOVE_ON`; third weak answer → `MOVE_ON` because of the cap, not taste; empty answer → `FOLLOW_UP`.

`evals/holdouts/` is the same idea, owned by the eval role. Holdout answers must not copy golden answers (containment + token Jaccard). If the engine overfits goldens, the holdout should still fail.

`evals/canaries/` are cases a real interviewer would follow up on, but the stub must **miss**. If the stub suddenly passes a canary, someone hardcoded a phrase. A perfect score can be evidence of cheating.

We assert the **decision enum**, not the follow-up wording. Wording changes every model call and would make the suite flaky.

Empty and whitespace answers fail closed in the engine before the provider runs. The follow-up cap still applies.

## Why an LLM judge is not the gate

People want a second model to read the transcript and score the interviewer. We do not merge on that.

- **Non-deterministic.** Same transcript, two scores. The agent “fixes” a 6 into a 7, re-runs, gets a 5, and either thrashes or stops on a lucky sample.
- **Same biases as the system under test.** Long fluent answers look good. Fabricated feedback that _sounds_ specific still passes a judge.
- **Reward hacking.** Agents have hit 100% judge pass with much lower real capability by echoing labels or writing reports the judge likes. If the judge can override goldens, the agent optimizes the judge.
- **Slow and keyed.** Putting it in `verify` makes agents skip it or burn the budget.

A judge score cannot pass a failed golden. A failed judge cannot fail a passed golden. Optional commentary only.

## Change review (deterministic, in the loop)

Semantic “does this match the human’s request?” is a human (or optional later LLM) job. The machine-checkable version is: the change is test-backed, the eval suite did not overfit, and Layer 0 contracts still have negatives.

The review step in `npm run harness`:

- Fixture JSON is Zod-validated; ids are unique.
- Goldens cover all four rubric dimensions, a `MOVE_ON` case, and the follow-up cap.
- Holdouts and canaries are independent of golden answers.
- Canaries set `stubMustMiss: true`; goldens/holdouts must not.
- Changed `app/` and `lib/` sources have colocated tests and stay under 200 countable lines.
- `.env*` files (except `.env.example`) cannot appear in the working tree diff.

Findings are in `evals/traces/latest-eval.json` under `review`. Per-case traces include input, decision, and pass/fail.

## What is a gate vs not

| Check                                      | Gate?                                  |
| ------------------------------------------ | -------------------------------------- |
| Schema, follow-up cap, quote-in-transcript | Yes                                    |
| Empty-answer fail-closed                   | Yes                                    |
| Goldens + independent holdouts + canaries  | Yes                                    |
| Deterministic change review                | Yes                                    |
| Colocated unit tests                       | Yes                                    |
| Playwright e2e                             | Not yet. Stub the model when we add it |
| LLM-as-judge / LLM code review             | Never in `verify`                      |

The harness is working when: `npm run verify` is the only “done”; a vague golden fails on `MOVE_ON`; a fake quote fails grounding; a copied holdout fails review; we can point at one fail → fix → pass in `docs/AI-DEV-LOG.md`.
