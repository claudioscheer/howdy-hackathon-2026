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
