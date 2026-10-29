@echo off
title Jeoparty.io - Multiplayer Jeopardy Server
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node "%~dp0server\server.js"
) else (
    call agy-node.cmd "%~dp0server\server.js"
)
pause
