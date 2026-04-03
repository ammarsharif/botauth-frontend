# BotAuth Manager — Windows PowerShell Build Script
$ErrorActionPreference = "Stop"

Write-Host "BotAuth Manager — Build" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Step 1: Generate icons (skipped if already present)
Write-Host "[1/3] Checking icons..." -ForegroundColor Yellow
if (-not (Test-Path "icons\icon16.png")) {
    Write-Host "      Generating placeholder icons..." -ForegroundColor Yellow
    node scripts/generate-icons.js
}
if (Test-Path "icons\icon16.png") {
    Write-Host "      Icons present." -ForegroundColor Green
}

# Step 2: Type-check with tsc
Write-Host "[2/3] Type-checking TypeScript..." -ForegroundColor Yellow
npx tsc --noEmit
Write-Host "      Type check passed." -ForegroundColor Green

# Step 3: Bundle with esbuild
Write-Host "[3/3] Bundling with esbuild..." -ForegroundColor Yellow
if (-not (Test-Path "dist")) { 
    New-Item -ItemType Directory -Path "dist" | Out-Null 
}

# Popup — IIFE so it loads as a plain script in popup.html
npx esbuild src/popup.ts --bundle --outfile=dist/popup.js --format=iife --target=chrome120 --minify

# Background service worker — IIFE
npx esbuild src/background.ts --bundle --outfile=dist/background.js --format=iife --target=chrome120 --minify

Write-Host ""
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "To install: open Chrome -> chrome://extensions -> Enable Developer Mode" -ForegroundColor Cyan
Write-Host "            -> Load unpacked -> select the 'botauth-manager\' folder" -ForegroundColor Cyan
