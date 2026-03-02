@echo off
title Excel Starter Kit v2
color 0A
echo.
echo  ╔═══════════════════════════════════════════════╗
echo  ║     Excel Starter Kit v2                      ║
echo  ║     Zustand + Shadcn/ui + Sonner + cmdk       ║
echo  ╚═══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Check for portable Node.js
if exist "node-portable\node.exe" (
    set "PATH=%~dp0node-portable;%PATH%"
    echo [OK] Using portable Node.js
) else (
    where node >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js not found! Install from https://nodejs.org
        pause
        exit /b 1
    )
)

echo [INFO] Checking dependencies...

:: Install server dependencies if missing
if not exist "server\node_modules" (
    echo [INSTALL] Installing server dependencies...
    cd server && call npm install && cd ..
)

:: Install client dependencies if missing
if not exist "client\node_modules" (
    echo [INSTALL] Installing client dependencies...
    cd client && call npm install && cd ..
)

:: Install root dependencies if missing
if not exist "node_modules" (
    echo [INSTALL] Installing root dependencies...
    call npm install
)

echo.
echo [START] Launching application...
echo         Server: http://localhost:4000
echo         Client: http://localhost:5173
echo.

:: Open browser after 3 seconds
start "" /min cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Start dev server
call npm run dev
