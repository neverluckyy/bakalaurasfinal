# This script should be run from the project root
# Usage: backend\scripts\start-dev.ps1 (from root) or ..\..\start-dev.ps1 (from backend\scripts)

# Change to project root if running from backend/scripts
if (Test-Path "..\..\package.json") {
    Set-Location "..\.."
}

Write-Host "Starting Social Engineering Learning App in development mode..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start both backend and frontend servers with automatic restart." -ForegroundColor Yellow
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Red
Write-Host ""
npm run dev
