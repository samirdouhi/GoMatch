@echo off
echo Stopping all services...

REM Stop processes
taskkill /F /IM dotnet.exe > nul 2>&1
taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1

REM Fermer toutes les fenêtres CMD ouvertes
taskkill /F /IM cmd.exe > nul 2>&1

echo All services and terminals closed.
exit