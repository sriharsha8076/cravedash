@echo off
REM ─────────────────────────────────────────────────────────
REM  CraveDash — Start Frontend (Vite dev server)
REM  Prerequisites: Node.js 18+
REM ─────────────────────────────────────────────────────────

echo.
echo  ========================================
echo    CraveDash Frontend (Vite Dev Server)
echo  ========================================
echo.

cd /d "%~dp0frontend"

REM Check node_modules
if not exist "node_modules" (
  echo  [1/2] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo  ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo  [2/2] Starting Vite dev server...
echo        URL: http://localhost:5173
echo.

call npm run dev

pause
