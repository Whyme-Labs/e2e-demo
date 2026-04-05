#!/usr/bin/env bash
set -euo pipefail

# Scaffold a Remotion project into the user's e2e/video/ directory
# Usage: bash scaffold-remotion.sh <project-root> <skill-dir>

PROJECT_ROOT="${1:-.}"
SKILL_DIR="${2:-.}"
TARGET="$PROJECT_ROOT/e2e/video"

if [ ! -d "$SKILL_DIR/templates/remotion" ]; then
  echo "Error: Remotion template not found at $SKILL_DIR/templates/remotion/"
  exit 1
fi

if [ -d "$TARGET/src" ]; then
  echo "Remotion project already exists at $TARGET. Skipping scaffold."
  exit 0
fi

echo "Scaffolding Remotion project at $TARGET..."
mkdir -p "$TARGET"

# Copy template files
cp -r "$SKILL_DIR/templates/remotion/"* "$TARGET/"

cd "$TARGET"

echo "Installing Remotion dependencies..."
npm install

echo "Remotion scaffold complete at $TARGET"
echo "  Render with: cd $TARGET && npx remotion render TestVideo ../../output/demo-full.mp4"
