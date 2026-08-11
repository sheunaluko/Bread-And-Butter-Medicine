#!/usr/bin/env bash
# Upload a Cloudflare Worker secret from a file or stdin.
#
# Usage:
#   scripts/set-secret.sh <NAME> <path-to-key-file>
#   pbpaste | scripts/set-secret.sh <NAME>
#   echo "sk-ant-..." | scripts/set-secret.sh <NAME>
#
# Examples:
#   scripts/set-secret.sh ANTHROPIC_API_KEY ~/keys/anthropic.txt
#   pbpaste | scripts/set-secret.sh ANTHROPIC_API_KEY
#
# Notes:
#   - Uses your existing wrangler auth (whichever CF account wrangler is
#     logged into). Verify with `npx wrangler whoami` first.
#   - The secret is encrypted at rest by Cloudflare — never printed, never
#     stored in this repo, never in git history.
#   - The trailing newline in the file (if any) is stripped so the secret
#     matches exactly what the provider issued.

set -euo pipefail

NAME="${1:-}"
FILE="${2:-}"

if [ -z "$NAME" ]; then
  echo "usage: $0 <NAME> [<path-to-file>]  (or pipe value on stdin)" >&2
  exit 2
fi

if [ -n "$FILE" ]; then
  if [ ! -f "$FILE" ]; then
    echo "no such file: $FILE" >&2
    exit 2
  fi
  # printf strips trailing newline; -c avoids running the whole file into memory.
  printf '%s' "$(cat "$FILE")" | npx wrangler secret put "$NAME"
else
  # Read stdin, strip trailing newline.
  VALUE="$(cat)"
  printf '%s' "$VALUE" | npx wrangler secret put "$NAME"
fi
