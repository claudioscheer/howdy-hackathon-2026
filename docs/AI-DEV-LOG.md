# AI development log

Dev Day **requires** this file. It is not a diary and not a second spec. Judges need one place that shows:

**act → verify → observe a failure → fix → verify again**

with no new human prompt in the middle of that loop. Keep it short. Add a note only when a real loop closed.

---

## 2026-09-03 — Landing control missing, tests named it

**Act.** Landing copy lives in `lib/ui/copy.ts`. The page exposes `data-testid="start-practice"`.

**Verify / observe.** The control was removed. `npm test` failed:

```
Unable to find an element by: [data-testid="start-practice"]
```

**Fix / verify again.** Restored the control. `npm run verify`:

```
  ✓ build / typecheck
  ✓ lint
  ✓ unit tests
  ✓ harness evals
verify passed
```

---

## 2026-09-03 — Harness review and canary flags

**Act.** Split the eval runner so Layer 0 proofs, fixtures, and review are real modules. Added independent holdouts, a stub-must-miss canary, and a deterministic change review.

**Verify / observe.** `vitest --coverage` failed twice:

```
TypeError: .toMatch() expects to receive a string, but got object
ERROR: Coverage for branches (96.27%) does not meet global threshold (100%)
```

The canary-flag test asserted on an array. `reviewHarness` and `runHarness` had untested fallback branches (`changedFiles` omitted, non-Error throw, missing `now`).

**Fix / verify again.** Asserted on `findings.join(" ")`. Covered the omitted-option branches. `npm run verify`:

```
  ✓ format
  ✓ build / typecheck
  ✓ lint
  ✓ unit tests + coverage
  ✓ harness evals
verify passed
```

---

## 2026-09-03 — CI-shaped review exposed an uncovered fallback

**Act.** Ran the full gate with `REVIEW_BASE_SHA` set to the main-branch commit,
matching the new clean-checkout CI review path.

**Verify / observe.** All 106 tests passed, but coverage failed because the
blank/all-zero base-SHA fallback had not executed:

```text
review-diff.ts | 100 | 98.24 | 100 | 100 | 30
ERROR: Coverage for branches (99.52%) does not meet global threshold (100%)
```

**Fix / verify again.** Added explicit blank and all-zero base cases, then reran
the same CI-shaped command without a human prompt. All five verification stages
passed.

---

## 2026-09-03 — Runtime contract migration caught by the full gate

**Act.** Moved model-boundary decisions to a discriminated runtime contract and
replaced the inverted canary with constant-decision sensitivity checks.

**Verify / observe.** Unit tests passed, but `npm run verify` continued into the
production build and lint stages and found two integration defects:

```text
Property 'dimension' does not exist on type ... { decision: "MOVE_ON" }
Async function 'runHarness' has too many lines (84). Maximum allowed is 80
```

**Fix / verify again.** Narrowed decisions on `decision === "FOLLOW_UP"` before
reading follow-up-only fields and extracted sensitivity bookkeeping from the main
runner. No human prompt occurred between failure and correction. The next full
run completed:

```text
✓ format
✓ build / typecheck
✓ lint
✓ unit tests + coverage
✓ harness evals
verify passed
```
