@echo off
title Jeoparty.io — Live Worldwide Tunnel
echo ====================================================================
echo   JEOPARTY.IO — LIVE WORLDWIDE MULTIPLAYER
echo ====================================================================
echo.
echo Starting local game server in background if not already running...
start /b "" powershell -Command "if (-not (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)) { agy-node.cmd '%~dp0server\server.js' }"
timeout /t 2 /nobreak >nul

if not exist "%~dp0cloudflared.exe" (
    echo [!] Downloading cloudflared helper for instant worldwide HTTPS tunnel...
    curl -L -o "%~dp0cloudflared.exe" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
)

echo.
echo ====================================================================
echo   CREATING SECURE WORLDWIDE PUBLIC HTTPS TUNNEL...
echo   Share the https://*.trycloudflare.com link with friends anywhere!
echo ====================================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause
