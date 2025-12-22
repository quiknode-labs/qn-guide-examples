#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root (two levels up from .git/hooks/)
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

node "$repo_root/scripts/generate-directory.js"

# Fail if README.md changed so the contributor can stage the update.
if ! git diff --quiet -- README.md; then
  echo ""
  echo "⚠️  README.md project directory was updated."
  echo "   Please stage the changes and commit again:"
  echo ""
  echo "   git add README.md"
  echo "   git commit"
  echo ""
  exit 1
fi