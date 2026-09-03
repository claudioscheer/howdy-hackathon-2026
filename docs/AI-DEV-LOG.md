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
