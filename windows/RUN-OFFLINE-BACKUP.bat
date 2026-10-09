@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Backup-And-Download-Latest.ps1"
echo.
echo Backup/download flow finished. Check messages above.
pause