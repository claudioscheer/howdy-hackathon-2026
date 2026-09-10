#!/usr/bin/env bash
# Canonical Dev Day gate. Silent on success, full output only on failure.
# Exit 2 on failure so Claude Code Stop hooks re-engage the agent.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"


if [ "${1:-}" = "--all" ]; then
  export TEST_ALL=1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

stages=("format" "build / typecheck" "lint" "unit tests + coverage" "harness evals")

run_stage() {
  case "$1" in
    0) pnpm run format:check ;;
    1) pnpm run build ;;
    2) pnpm run lint ;;
    3) pnpm run test ;;
    4) pnpm run harness ;;
  esac
}

declare -a pids
for i in "${!stages[@]}"; do
  log="$tmp_dir/$i.log"
  status_file="$tmp_dir/$i.status"
  (
    if run_stage "$i" >"$log" 2>&1; then
      echo 0 > "$status_file"
    else
      echo $? > "$status_file"
    fi
  ) &
  pids[$i]=$!
done

for pid in "${pids[@]}"; do
  wait "$pid" 2>/dev/null || true
done

failed=0
for i in "${!stages[@]}"; do
  stage="${stages[$i]}"
  log="$tmp_dir/$i.log"
  status_file="$tmp_dir/$i.status"
  code=1
  if [ -f "$status_file" ]; then
    code="$(cat "$status_file")"
  fi

  if [ "$code" -eq 0 ]; then
    printf "  ✓ %s\n" "$stage"
  else
    failed=1
    printf "  ✗ %s\n" "$stage"
    if [ -f "$log" ]; then
      cat "$log"
    fi
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "verify failed"
  exit 2
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  printf "  ✗ browser journey\n"
  echo "DATABASE_URL is required for the browser journey. Copy .env.example to .env and start Postgres with docker compose up -d."
  echo "verify failed"
  exit 2
fi

if ! pnpm prisma migrate deploy; then
  printf "  ✗ browser journey\n"
  echo "Prisma migrate failed. Is Postgres running?"
  echo "verify failed"
  exit 2
fi

if ! pnpm prisma db seed; then
  printf "  ✗ browser journey\n"
  echo "Prisma seed failed. Is Postgres running?"
  echo "verify failed"
  exit 2
fi

if pnpm run test:e2e >"$tmp_dir/e2e.log" 2>&1; then
  printf "  ✓ browser journey\n"
else
  printf "  ✗ browser journey\n"
  cat "$tmp_dir/e2e.log"
  echo "verify failed"
  exit 2
fi

echo "verify passed"
exit 0
