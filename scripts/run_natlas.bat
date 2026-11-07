@echo off
rem Script to start N-ATLaS Modal service for Elevoni integration

rem Ensure Modal CLI is in PATH
where modal >nul 2>&1
if errorlevel 1 (
  echo Modal CLI not found in PATH. Please install it and add to your PATH.
  exit /b 1
)

cd "%~dp0..\N-ATLAS-Kit\serve"

rem Run the Modal app (will start a container, then perform health check)
modal run modal_app.py

pause