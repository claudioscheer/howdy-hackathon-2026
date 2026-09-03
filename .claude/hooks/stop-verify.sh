#!/usr/bin/env bash
# Stop hook: do not let the agent finish on a red unit suite.
# Full `npm run verify` (build + lint + tests + evals) is required to claim done;
# this hook only runs the fast gate so we do not burn minutes on every stop.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

tmp="$(mktemp)"
if npm run test >"$tmp" 2>&1; then
  rm -f "$tmp"
  exit 0
fi

echo "Stop blocked: unit tests failed. Fix before finishing."
cat "$tmp" >&2
rm -f "$tmp"
exit 2
