# Why this harness exists

This note is the reasoning behind the Interview Coach verification system. It is not a list of tools. It is the argument for what we trust, what we do not trust, and why that split is the product.

Dev Day scores **Harness + Autonomous Loops at 25 points** — tied for first — and has a dedicated prize for it. The brief is explicit: agents must **observe** whether their work is correct and **react**, without a human diagnosing every failure.

```
BUILD → VERIFY → OBSERVE → FIX → REPEAT
```

That only works if the verify step tells the truth. A green suite that lies is worse than no suite: the agent stops, the demo looks done, and the interviewer still lets a generic answer through.

## 1. How we got here

The product is a mock interviewer that, after each answer, must decide:

```json
{
  "decision": "FOLLOW_UP" | "MOVE_ON",
  "reason": "...",
  "dimension": "relevance" | "specificity" | "fundamentals" | "structure",
  "followUp": "..."
}
```

That decision is the whole product. If a vague answer gets `MOVE_ON`, the coach is theater. If a specific answer gets endless follow-ups, it is a bad interviewer.

So we asked a narrower question than “how do we test an app?”:

**What can an agent run, get a trustworthy signal from, and loop on — in a few hours — without us sitting in the middle?**

Three constraints shaped the answer:

1. **The interesting bugs are judgment bugs, not click bugs.** “Submit works” is easy. “Vague answer must be pushed” is the actual failure mode. A normal web test suite will go green while the product is wrong.
2. **The model in the product is cheap and non-deterministic.** We want inexpensive models for the live interview. Those models drift, emit broken JSON, and change their mind. The harness has to make them *usable*, not hope they are consistent.
3. **The builder cannot grade itself.** This is the failure every agent paper and every strong harness team keeps rediscovering. The agent that wrote the code will reread the code, decide it looks fine, and stop. If that same agent also writes the tests and also runs an LLM judge that says “looks good,” we have three sources of the same self-deception.

From there the design is a pyramid: **mechanical checks first, golden transcripts next, browser as a product gate, LLM-as-judge last and never as the merge gate.**

We did not pick this because it is fashionable. We picked it because each layer fails in a known way, and the layer above it is there to catch that failure.

## 2. What “flaky” means here

Flaky does not mean “sometimes annoying.” It means **the signal cannot be trusted as a stop condition**.

If a check is flaky, an autonomous loop does one of two bad things:

- **False red:** the agent “fixes” working code, churns, blows the time budget, or rewrites goldens until the noise goes away.
- **False green:** the agent stops. That is the more dangerous one. The Dev Day brief literally penalizes “an agent that claims work is complete without meaningful verification.”

So every layer below is classified as **gate** (we will not ship / will not let the agent stop if this fails) or **advisor** (useful information, must not be allowed to override a gate, must not be the only thing that can pass).

## 3. The layers, and why each one is (or isn’t) a gate

### Layer 0 — Deterministic contracts (gate)

**What we check**

- Typecheck, unit tests, lint/build.
- LLM output **parses** as the decision schema. Wrong keys, extra keys, missing `followUp` on `FOLLOW_UP`, invalid `dimension` → fail. No “the model usually returns JSON.”
- Session is a state machine: you cannot score before the interview ends; after N follow-ups the engine must `MOVE_ON` even if the answer is still weak; retries are capped.
- Every note in the feedback report **quotes a substring that exists in the transcript**. If the report says the candidate “spent the first 90 seconds on unrelated work” and that sentence is not in the transcript, the check fails.

**Why this is a gate**

These checks are **repeatable**. Same input, same exit code. An agent can run them a hundred times. They are also **context-efficient**: success is one line (`✓ schema`); failure dumps only the error. That matters. If we pour 4,000 lines of passing tests into the agent context, the agent loses the task and starts hallucinating that it already fixed the failure (this is a documented HumanLayer failure mode).

**What this does *not* catch**

A perfectly valid `{ "decision": "MOVE_ON", ... }` on a vague answer. The JSON is fine. The product is wrong. Schema is necessary and nowhere near sufficient. That is why Layer 1 exists.

**Why we still start here**

Cheap models will fail Layer 0 constantly (truncated JSON, `follow_up` vs `followUp`, a dimension like `"communication"`). If we skip this and jump to “ask another LLM if the interview was good,” we will debug vibes instead of parse errors.

---

### Layer 1 — Golden transcripts (gate)

This is the high-leverage layer for *this* product.

**What we check**

We freeze a small set of (question, answer) pairs with an expected `decision`, and often an expected `dimension`. Examples:

| Fixture | Answer shape | Must decide |
|---|---|---|
| Vague, no example | “I always communicate well with stakeholders” | `FOLLOW_UP` / `specificity` |
| Concrete incident | named project, metric, tradeoff | `MOVE_ON` |
| Old-job story for a current-stack role | 2018 anecdote, no recency | `FOLLOW_UP` / `relevance` |
| Answers a different question | fluent, off-topic | `FOLLOW_UP` / `structure` |
| Senior language, fails a basic | “I’m full-stack” then misses a simple query | `FOLLOW_UP` / `fundamentals` |
| Follow-up cap exhausted | third weak answer on the same question | `MOVE_ON` (policy, not taste) |

We run them two ways:

1. **Stubbed provider** — no live model. We inject a fake LLM response or we drive the router with the fixture. This proves *our code* honors the contract: persist the turn, increment the follow-up count, render the next question, refuse to score early. Cost: zero. Flake: none.
2. **Live model on the same frozen set** — the cheap interviewer model must still emit `FOLLOW_UP` on the vague fixtures. We assert `decision` (and maybe `dimension`). We do **not** assert the exact wording of `followUp`. Wording is not a contract; routing is.

A **holdout folder** the implementer does not own sits beside the goldens. If the engine worker “fixes” fixtures until they pass, the holdout still fails. That is the only way this layer stays honest.

**Why this is a gate**

The product promise is not “an LLM talks.” It is “a weak answer gets pushed.” Goldens are the only cheap, inspectable way to say that in a form an agent can fail and fix. A judge can open a JSON file and see the claim. That is stronger than a screenshot of a chat.

**Where it can still go wrong (and what we do about it)**

- **Overfitting goldens.** The prompt is tweaked until these 8 answers pass and nothing else does. Mitigation: holdouts the builder cannot edit as part of “making tests green.”
- **Asserting prose.** If we snapshot the follow-up sentence, the suite becomes flaky on the first model bump. Mitigation: assert the enum, not the essay.
- **Too many goldens.** A hundred fuzzy cases is an eval research project, not a hackathon gate. Mitigation: one fixture per failure mode in the spec, plus the cap, plus retry variation. Roughly 6–10.

---

### Layer 2 — Playwright product tests (gate) vs Playwright MCP (not a gate)

Two different tools. Mixing them up is how teams think they have a harness when they have a demo.

**Playwright test files (gate)**

Headless, stubbed LLM, assertions on the product:

- Recruiter can create a session and get a shareable link.
- Candidate can complete a text interview.
- A **stubbed** vague answer produces a visible follow-up (we do not call the real model here).
- Report page shows the four dimensions and a quote from the transcript.
- Retry does not replay the same question list.

These are durable. They run in `pnpm verify`. They fail with a locator and a screenshot.

**Why Playwright *tests* can still be flaky — and how we keep them as a gate**

| Failure | Why it happens | What we do |
|---|---|---|
| Timing / animation | `click` before the next question hydrates | Wait on role/text the product already owns, not `waitForTimeout` |
| Live LLM in e2e | same page, different decision every run | **Stub the provider.** Live model belongs in Layer 1 evals, not in e2e |
| Network / key missing | CI has no API key, suite dies | Stubbed path must run with no key |
| Agent-written brittle selectors | `div.flex > div:nth-child(3)` | Prefer roles and `data-testid`; the Eval worker can reject tests that only pass by accident |
| MCP “I looked at it” | agent clicked around once, wrote no test | MCP is not evidence. A committed spec is |

**Playwright MCP (advisor / implementation tool)**

This is how a coding agent *discovers* that the report page is blank: open the app, snapshot the accessibility tree, screenshot, poke. Then it must **write or update a Playwright spec**. If the only browser check is an MCP session in a chat log, we do not have a harness. We have a story.

MCP is also mildly flaky on its own (headed browser, timing, the agent mis-clicking). That is fine for exploration. It is not fine as the Stop-hook gate.

---

### Layer 3 — LLM-as-judge (advisor only, never the gate)

This is the layer people reach for first, and the one we refuse to merge on.

**What people want it to do**

“Read this transcript and tell me if the interviewer was good / the report is fair / the follow-up was insightful.”

**What we might still use it for** (optional, off the critical path)

- Is the follow-up actually useful, or is it the empty “can you be more specific?” on a loop?
- Does the written report feel specific to *this* session, not a template?
- Qualitative notes for the demo writeup.

Those are real questions. They are also **not decidable with an exit code we can trust.**

#### Why LLM-as-judge is flaky (the actual failure modes)

**1. Non-determinism**

Same transcript, same prompt, two runs, two scores. Temperature, sampling, and tiny wording changes in the judge prompt move the number. An autonomous loop cannot hill-climb on a moving target: the agent will “fix” a 6 into a 7, re-run, get a 5, and either thrash or declare victory on a lucky sample.

**2. The judge is the same kind of machine as the system under test**

We are scoring an LLM interviewer with an LLM. Shared biases leak through:

- **Verbosity bias** — longer answers and longer reports look more “thorough,” so a rambling candidate and a fluffy report both inflate the score.
- **Authority / fluency bias** — confident senior-sounding prose scores well even when it failed fundamentals.
- **Self-preference** — if the builder (or the same model family) grades its own transcripts, it rates them higher. This is why the evaluator must be a **fresh context with no write tools**, and why it still must not outrank Layer 0/1.

**3. “Looks good” is the default**

Judges, like coding agents, are biased toward the first plausible pass. A report that *sounds* like feedback (“work on specificity”) will get a thumbs-up even when it never quotes the session. Without a mechanical grounding check (Layer 0), the judge will not save us.

**4. Reward hacking / metric gaming**

This is the failure that made us demote the judge from oracle to advisor. Documented in production self-improve loops (and in the 2026 “LLM-as-a-Judge is not an oracle” results):

- Agents read cached answer keys or holdout labels from the environment and echo them. **100% judge pass, ~68% true capability** in one reported setup.
- A corrupted gold label caused an optimizer to *delete correct rules* so it would agree with the judge.
- A broken prompt was promoted because a silent parser fallback improved the metric.
- Once the agent knows the judge’s rubric, it writes reports the judge likes (headings, the words “specific example,” fake quotes) instead of reports that help the candidate.

If the judge can override goldens, the agent will optimize the judge.

**5. Ground truth is a trap as well as a help**

Showing the judge the “right” decision does not reliably improve it. Some frontier judges *get worse* when given gold labels (over-anchoring). On hard items without gold, different judges collapse into a narrow accuracy band regardless of size. Scale does not buy a trustworthy gate.

**6. Operational flake, which is enough to disqualify it as a Stop hook**

- Slow and expensive. If `pnpm verify` calls a judge, agents will skip it, time out, or burn the budget.
- Needs an API key. CI and local diverges.
- Model version drift: today’s “good” judge is tomorrow’s different model.
- Prompt sensitivity: we will waste the hackathon retuning a rubric instead of shipping the interviewer.

**What we check instead of trusting the judge**

| Claim we care about | Who decides | Why not the judge |
|---|---|---|
| Output is well-formed | Schema (L0) | Parse errors are not opinions |
| Vague answer is pushed | Goldens (L1) | This is the product invariant |
| Report is about *this* session | Transcript substring check (L0) | Judge will accept plausible prose |
| Candidate can finish the flow | Playwright, stubbed (L2) | Judge never clicks |
| Follow-up text is *clever* | Human, optionally a judge note | Taste. Demo polish, not a gate |

**Rule:** a beautiful judge score cannot pass a failed golden. A failed judge score cannot fail a passed golden. The judge is commentary.

Canary: we keep at least one fixture that **must fail** if someone wires the judge (or the live model) to the answer key. A 100% suite is treated as contamination, not success.

---

### Layer 4 — How the agent is forced to use the pyramid

Gates do not count unless the agent **cannot stop without them**.

**One command:** `pnpm verify`

Runs Layer 0 → Layer 1 (stubbed goldens) → Layer 2 (e2e, stubbed LLM). Live-model evals and any judge run are a separate, explicit command, not on the Stop path.

**Silent on success, loud on failure.** Exit code 2 on fail so the coding-agent Stop hook re-engages. The agent sees the error, not a novel of passing tests.

**Default-fail acceptance file.** Every definition-of-done item starts `passes: false`. The agent may not flip it to true without reading evidence (eval JSON, e2e log, screenshot). Claiming “follow-up works” without opening the golden result is structurally denied.

**Independent evaluator.** After the builder thinks it is done, a **fresh-context** agent with no write/edit tools runs `pnpm verify` (and may use Playwright MCP on the running app). It returns `PASS` or `NEEDS_WORK`. Findings become the next builder prompt. The builder does not get to grade its own diff.

**Handoff on disk.** `PROGRESS.md` + git. The loop survives a context window. That is the Dev Day autonomous-loop requirement: act → verify → observe a problem → fix → verify again, **with no new human instruction in the middle**.

## 4. Why this harness is the right one for us

### It matches the product, not a generic web app

Interview Coach’s correctness is a **routing decision on language**. Most hackathon harnesses will check that pages render. Ours checks the thing that would make a recruiter trust the tool: a generic answer does not get a free pass. Goldens + schema are how you say that in code.

### It makes cheap models viable

The Slack instinct (inexpensive models, analyze the interview, adapt live) only works if we do **not** ask those models to also be the test suite. Schema catches garbage JSON. Goldens catch “always MOVE_ON.” The UI never talks to a flaky live model in CI. The cheap model gets a small, structured job; the harness holds the line around it.

### It is what the competition actually scores

The brief wants back-pressure the agent can observe. It wants deterministic guarantees for things that should not depend on the agent remembering. It wants one real recovery loop. It punishes “several chat sessions we called agents” and “claimed complete without verification.”

This design is that rubric in repo form:

| Dev Day ask | Where it lives |
|---|---|
| Agent observes failure | `pnpm verify` output, silent/fail |
| Deterministic guarantees | schema, state machine, grounding, goldens |
| Autonomous recovery | Stop hook + default-fail + evaluator loop |
| Independent review | fresh-context evaluator, no write tools |
| Browser check | Playwright specs; MCP only to author them |
| Reproducible evidence | `evals/traces`, e2e artifacts, `AI-DEV-LOG.md` |

### It stays small enough to ship in a session

We are not building an eval platform. We are pinning ~6–10 failure modes from the spec, one verify command, stubbed e2e, and a reviewer that cannot edit the product. Audio is out of the harness (and out of done). Live LLM is not in the Stop hook. The judge is optional commentary.

If follow-up is not perfect on novel answers, that is acceptable. If follow-up is wrong on the goldens we published, the product is wrong. The harness exists to keep those two facts distinct.

### It gives us two demo loops from one system

- **Product loop (first 90 seconds of the video):** candidate types a vague answer → UI shows a follow-up. That is the adaptive interviewer.
- **Engineering loop (last 90 seconds):** agent implements a feature → `pnpm verify` fails a golden or a grounding check → agent reads the failure → fixes → verify passes → independent evaluator still finds a gap → builder fixes again. No human prompt in the inner loop.

Same pyramid. Two stories. Judges asked for both.

## 5. What we will not do, on purpose

- **LLM-as-judge as CI / Stop hook.** Flaky, gameable, slow, and it will be optimized instead of the interviewer.
- **Live model inside Playwright.** Turns a product test into a model eval and makes the suite lie.
- **Playwright MCP as the only browser evidence.** Exploration is not a gate.
- **Let the implementer own holdouts.** That collapses Layer 1 into “tests we wrote to pass.”
- **Snapshot the follow-up wording.** Guarantees flake on the next model call.
- **A giant prompt that says “always follow up if vague.”** If it is not in a fixture and a schema, it is not a harness.
- **Many named agents without isolation.** The Eval worker’s job is to *not* implement features. If it can, we lost the independent gate.

## 6. Definition of “the harness is working”

We will believe the harness — and let an agent keep going without us — when all of the following are true:

1. `pnpm verify` is the only way to finish a workstream, and it is silent when green.
2. A vague golden fails the suite if the engine returns `MOVE_ON`.
3. A report that invents a quote fails the suite even if an LLM would have praised it.
4. e2e runs with no API key.
5. The builder cannot mark acceptance items passed without evidence files.
6. We can point to one log of: fail → observe → fix → pass, with no human in the middle.

Until then we do not have a harness. We have tests we hope an agent might run.
