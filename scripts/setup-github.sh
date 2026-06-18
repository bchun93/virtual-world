#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"
REPO_NAME="short-term-rental-business"

cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is not installed."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub authentication required."
  echo "Run: gh auth login --hostname github.com --git-protocol https --web"
  exit 1
fi

GITHUB_USER="$(gh api user -q .login)"
REMOTE="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already configured."
else
  if gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
    echo "Repository already exists on GitHub. Adding remote..."
    git remote add origin "$REMOTE"
  else
    echo "Creating private GitHub repository ${GITHUB_USER}/${REPO_NAME}..."
    gh repo create "$REPO_NAME" \
      --private \
      --source=. \
      --remote=origin \
      --description "Short-term rental business project management hub"
  fi
fi

echo "Pushing main branch..."
git push -u origin main

echo "Enabling GitHub Pages (GitHub Actions source)..."
gh api \
  -X PUT \
  "/repos/${GITHUB_USER}/${REPO_NAME}/pages" \
  -f build_type=workflow >/dev/null 2>&1 || true

PAGES_URL="https://${GITHUB_USER}.github.io/${REPO_NAME}/"

echo ""
echo "Setup complete."
echo "Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "Live site (after first deploy): ${PAGES_URL}"
echo ""
echo "Watch deployment:"
echo "  gh run list --repo ${GITHUB_USER}/${REPO_NAME}"
echo "  gh run watch --repo ${GITHUB_USER}/${REPO_NAME}"
