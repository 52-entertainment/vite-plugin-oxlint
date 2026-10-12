#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit) — auto-format edited src/**/*.ts files with oxfmt.
# Fail-soft: any error => exit 0, never block Claude.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Read the hook payload (JSON) from stdin.
payload="$(cat 2>/dev/null || true)"
[ -z "$payload" ] && exit 0

# Extract file_path. Prefer jq; fall back to a regex if jq is missing.
file_path=""
if command -v jq >/dev/null 2>&1; then
  file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
fi
if [ -z "$file_path" ]; then
  file_path="$(printf '%s' "$payload" | sed -nE 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n1)"
fi
[ -z "$file_path" ] && exit 0

case "$file_path" in
  /*) abs_path="$file_path" ;;
  *)  abs_path="$REPO_ROOT/$file_path" ;;
esac

# Only TypeScript sources under src/.
case "$abs_path" in
  "$REPO_ROOT"/src/*.ts) ;;
  *) exit 0 ;;
esac

[ -f "$abs_path" ] || exit 0

# Repo-pinned binary (pnpx would download a registry version instead).
[ -x "$REPO_ROOT/node_modules/.bin/oxfmt" ] || exit 0
cd "$REPO_ROOT" 2>/dev/null || exit 0
"$REPO_ROOT/node_modules/.bin/oxfmt" "$abs_path" >/dev/null 2>&1 || true

exit 0
