@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo Real Estate Caller Desk - Windows LAN Server
echo ===============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Install Node.js, then reopen this file.
  pause
  exit /b 1
)
node --version
if not exist "data\database.json" (
  echo.
  echo First run: create the Admin account first.
  echo In this folder, open PowerShell and run:
  echo npm run setup-admin -- admin "Your-Unique-Password-At-Least-12-Chars" admin@local.test
  echo Replace the example password with your own. Do not share it.
  pause
  exit /b 1
)
echo.
echo Keep this window open while Android/Windows clients use the system.
echo Do not expose port 8080 to the public internet.
echo.
npm start
pause
