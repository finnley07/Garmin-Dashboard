@echo off
setlocal
title Garmin Activity Dashboard
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js is not installed.
  echo Please install it: https://nodejs.org  ^(version 22 or newer^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo.
  echo First-time setup: running npm install...
  echo.
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

set GARMIN_DASH_OPEN_BROWSER=1
echo.
echo Starting Garmin Activity Dashboard...
echo The browser will open automatically. Keep this window open!
echo To stop: close this window or press Ctrl+C
echo.

call npm start
echo.
pause
