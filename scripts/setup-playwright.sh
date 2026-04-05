#!/usr/bin/env bash
set -euo pipefail

# Setup Playwright in the user's project for E2E testing
# Usage: bash setup-playwright.sh <project-root>

PROJECT_ROOT="${1:-.}"

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "Error: No package.json found in $PROJECT_ROOT"
  exit 1
fi

cd "$PROJECT_ROOT"

echo "Installing Playwright..."
npm install --save-dev playwright @playwright/test

echo "Installing Playwright browsers (chromium only for speed)..."
npx playwright install chromium

# Create e2e directories
mkdir -p e2e/{recordings,screenshots,output}

# Create initial timing-data.json and error-log.json
echo "[]" > e2e/timing-data.json
echo "[]" > e2e/error-log.json

echo "Playwright setup complete."
echo "  Recordings: e2e/recordings/"
echo "  Screenshots: e2e/screenshots/"
echo "  Output: e2e/output/"
