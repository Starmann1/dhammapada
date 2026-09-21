@echo off
title Dhammapada AI Study Companion Launcher
echo ===================================================
echo   Starting Dhammapada AI Study Companion
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend API (Port 8001)...
start "Dhammapada Backend API" cmd /k "python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001"

echo [2/2] Launching Frontend Web Server (Port 8000)...
start "Dhammapada Frontend Web UI" cmd /k "python -m http.server 8000 --bind 127.0.0.1"

echo.
echo ===================================================
echo   Both services are running!
echo   - Web UI:       http://localhost:8000
echo   - API Swagger:  http://localhost:8001/docs
echo   - Health Check: http://localhost:8001/api/health
echo ===================================================
echo.
timeout /t 3 >nul
start http://localhost:8000
