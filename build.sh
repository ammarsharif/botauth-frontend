#!/bin/bash
set -e

echo "BotAuth Manager — Build"
echo "========================"

# Step 1: Generate icons (skipped if already present)
if [ ! -f "icons/icon16.png" ]; then
  echo "[1/3] Generating placeholder icons..."
  node scripts/generate-icons.js
else
  echo "[1/3] Icons already present — skipping."
fi

# Step 2: Type-check with tsc
echo "[2/3] Type-checking TypeScript..."
npx tsc --noEmit
echo "      Type check passed."

# Step 3: Bundle with esbuild
echo "[3/3] Bundling with esbuild..."
mkdir -p dist

# Popup — IIFE so it loads as a plain script in popup.html
npx esbuild src/popup.ts \
  --bundle \
  --outfile=dist/popup.js \
  --format=iife \
  --target=chrome120 \
  --minify

# Background service worker — IIFE (classic service worker, no "type":"module" needed)
npx esbuild src/background.ts \
  --bundle \
  --outfile=dist/background.js \
  --format=iife \
  --target=chrome120 \
  --minify

echo ""
echo "Build complete!"
echo "To install: open Chrome -> chrome://extensions -> Enable Developer Mode"
echo "            -> Load unpacked -> select the 'botauth-manager/' folder"
