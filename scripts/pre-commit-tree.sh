#!/usr/bin/env bash
set -euo pipefail

# Navigate to repo root (two levels up from .git/hooks/)
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Generate the project directory
node "$repo_root/scripts/generate-directory.js"

# If README.md changed, auto-stage it into the current commit
if ! git diff --quiet -- README.md; then
  git add README.md
  echo "✓ README.md project directory updated and staged"
fi