@echo off
REM This script should be run from the project root
REM Usage: backend\scripts\start-app.bat (from root) or ..\..\start-app.bat (from backend\scripts)

REM Change to project root if running from backend/scripts
if exist "..\..\package.json" (
    cd ..\..
)

echo Starting Social Engineering Learning Application...
echo.
echo This will start both backend and frontend servers
echo and automatically verify that authentication works.
echo.
echo Press any key to continue...
pause >nul

npm start

echo.
echo Application stopped.
pause
