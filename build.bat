@echo off
echo ========================
echo BotAuth Manager - Build
echo ========================

:: Step 1: Icons
if not exist icons\icon16.png (
  echo [1/3] Generating placeholder icons...
  node scripts/generate-icons.js
) else (
  echo [1/3] Icons already present.
)

:: Step 2: Types
echo [2/3] Type-checking TypeScript...
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
  echo Error: TypeScript health check failed.
  exit /b %ERRORLEVEL%
)

:: Step 3: Bundle
echo [3/3] Bundling with esbuild...
if not exist dist mkdir dist

call npx esbuild src/popup.ts --bundle --outfile=dist/popup.js --format=iife --target=chrome120 --minify
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

call npx esbuild src/background.ts --bundle --outfile=dist/background.js --format=iife --target=chrome120 --minify
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo Build complete!
echo To install: open Chrome - chrome://extensions - Enable Developer Mode
echo             - Load unpacked - select the botauth-manager folder
