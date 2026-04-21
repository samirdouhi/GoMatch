@echo off
setlocal
title PFA-Platform - Start All Services

echo ==========================================
echo   Starting PFA-Platform services...
echo ==========================================

REM ===== GATEWAY =====
if exist "%~dp0backend\Gateway\ApiGateway\ApiGateway.csproj" (
    start "Gateway" /D "%~dp0backend\Gateway\ApiGateway" cmd /k "dotnet run --launch-profile https"
) else (
    echo [ERROR] Gateway project not found
)

REM ===== AUTH SERVICE =====
if exist "%~dp0backend\Services\Auth\AuthService\AuthService\AuthService.csproj" (
    start "AuthService" /D "%~dp0backend\Services\Auth\AuthService\AuthService" cmd /k "dotnet run --launch-profile https"
) else (
    echo [ERROR] AuthService project not found
)

REM ===== BUSINESS SERVICE =====
if exist "%~dp0backend\Services\BusinessService\BusinessService.csproj" (
  start "BusinessService" /D "%~dp0backend\Services\BusinessService" cmd /k "dotnet run"
) else (
    echo [ERROR] BusinessService project not found
)

REM ===== EVENT MATCH SERVICE =====
if exist "%~dp0backend\Services\EventMatchService\EventMatchService.csproj" (
    start "EventMatchService" /D "%~dp0backend\Services\EventMatchService" cmd /k "dotnet run --launch-profile https"
) else (
    echo [ERROR] EventMatchService project not found
)

REM ===== PROFILE SERVICE =====
if exist "%~dp0backend\Services\ProfileService\ProfileService\ProfileService.csproj" (
    start "ProfileService" /D "%~dp0backend\Services\ProfileService\ProfileService" cmd /k "dotnet run --launch-profile https"
) else (
    echo [ERROR] ProfileService project not found
)

REM ===== SERVICE DECOUVERTE =====
if exist "%~dp0backend\Services\ServiceDecouverte\ServiceDecouverte\ServiceDecouverte.csproj" (
    start "ServiceDecouverte" /D "%~dp0backend\Services\ServiceDecouverte\ServiceDecouverte" cmd /k "dotnet run --launch-profile https"
) else (
    echo [ERROR] ServiceDecouverte project not found
)

REM ===== RECO SERVICE (PYTHON) =====
if exist "%~dp0backend\Services\RecoService\app\main.py" (
    start "RecoService" /D "%~dp0backend\Services\RecoService" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
) else (
    echo [ERROR] RecoService main.py not found
)

REM ===== WAIT BEFORE FRONTEND =====
timeout /t 20 /nobreak > nul

REM ===== FRONTEND =====
if exist "%~dp0frontend\package.json" (
    start "Frontend" /D "%~dp0frontend" cmd /k "npm run dev"
) else (
    echo [ERROR] Frontend package.json not found
)

echo.
echo Finished sending launch commands.
pause