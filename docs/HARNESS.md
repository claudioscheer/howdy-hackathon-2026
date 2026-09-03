# Harness

We need a check an agent can run, trust, and loop on. `npm run verify` is that check. If it is green, the work can stop. If it is red, the agent must fix the named failure — not ask a human what went wrong.

Dev Day scores this at 25 points. A green suite that lies is worse than no suite: the agent stops and a vague answer still gets `MOVE_ON`.

## What verify does

1. **Prettier** — formatting is not optional.
2. **Build / types / lint** — compiles; no `any` / `as unknown` / `as never`; files stay small.
3. **Unit tests next to source, 100% coverage** on `app/page.tsx` and `lib/`.
4. **`evals/` goldens and holdouts** — frozen (question, answer) → expected `FOLLOW_UP` or `MOVE_ON`.
5. **Write `acceptance.json` and `evals/traces/latest-eval.json`** from that run. Do not flip `passes` by hand.

Success is one line per stage. Failure dumps only the error. That keeps the agent’s context small.

## Why `evals/` exists

The interesting bug is not “the button clicked.” It is “the interviewer let a generic answer through.” A normal web test will not catch that.

Each file in `evals/goldens/` is a fixture: vague claim → `FOLLOW_UP` / `specificity`; old-job story → `FOLLOW_UP` / `relevance`; concrete metric → `MOVE_ON`; third weak answer → `MOVE_ON` because of the cap, not taste.

`evals/holdouts/` is the same idea, owned by the eval role. If the engine “fixes” goldens until they pass, the holdout should still fail.

We assert the **decision enum**, not the follow-up wording. Wording changes every model call and would make the suite flaky.

## Why an LLM judge is not the gate

People want a second model to read the transcript and score the interviewer. We do not merge on that.

- **Non-deterministic.** Same transcript, two scores. The agent “fixes” a 6 into a 7, re-runs, gets a 5, and either thrashes or stops on a lucky sample.
- **Same biases as the system under test.** Long fluent answers look good. Fabricated feedback that _sounds_ specific still passes a judge.
- **Reward hacking.** Agents have hit 100% judge pass with much lower real capability by echoing labels or writing reports the judge likes. If the judge can override goldens, the agent optimizes the judge.
- **Slow and keyed.** Putting it in `verify` makes agents skip it or burn the budget.

A judge score cannot pass a failed golden. A failed judge cannot fail a passed golden. Optional commentary only.

## What is a gate vs not

| Check                                      | Gate?                                  |
| ------------------------------------------ | -------------------------------------- |
| Schema, follow-up cap, quote-in-transcript | Yes                                    |
| Goldens + holdout                          | Yes                                    |
| Colocated unit tests                       | Yes                                    |
| Playwright e2e                             | Not yet. Stub the model when we add it |
| LLM-as-judge                               | Never                                  |

The harness is working when: `npm run verify` is the only “done”; a vague golden fails on `MOVE_ON`; a fake quote fails grounding; we can point at one fail → fix → pass in `docs/AI-DEV-LOG.md`.
