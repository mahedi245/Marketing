@echo off
title Marketing Visit Management System
cd /d "%~dp0"

echo =========================================================
echo    Marketing Team Visit Tracker & Customer Management
echo =========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please ensure Node.js is installed.
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [INFO] Installing required packages...
    call npm install
    echo.
)

echo [INFO] Starting Application Server...
timeout /t 2 >nul
start http://localhost:3000
node server.js

pause
