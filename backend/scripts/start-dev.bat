@echo off
REM This script should be run from the project root
REM Usage: backend\scripts\start-dev.bat (from root) or ..\..\start-dev.bat (from backend\scripts)

REM Change to project root if running from backend/scripts
if exist "..\..\package.json" (
    cd ..\..
)

echo Starting Social Engineering Learning App in development mode...
echo.
echo This will start both backend and frontend servers with automatic restart.
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers.
echo.

npm run dev
