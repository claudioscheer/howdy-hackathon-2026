#!/usr/bin/env bash
# Canonical Dev Day gate. Silent on success, full output only on failure.
# Exit 2 on failure so Claude Code Stop hooks re-engage the agent.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

run_silent() {
  local desc="$1"
  shift
  local tmp
  tmp="$(mktemp)"
  if "$@" >"$tmp" 2>&1; then
    printf "  ✓ %s\n" "$desc"
    rm -f "$tmp"
    return 0
  else
    local code=$?
    printf "  ✗ %s\n" "$desc"
    cat "$tmp"
    rm -f "$tmp"
    return "$code"
  fi
}

failed=0

run_silent "format" pnpm run format:check || failed=1
run_silent "build / typecheck" pnpm run build || failed=1
run_silent "lint" pnpm run lint || failed=1
run_silent "unit tests + coverage" pnpm run test || failed=1
run_silent "harness evals" pnpm run harness || failed=1

if [ "$failed" -ne 0 ]; then
  echo "verify failed"
  exit 2
fi

echo "verify passed"
exit 0
