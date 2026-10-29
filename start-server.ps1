# Jeoparty.io — Multiplayer Jeopardy Server Launcher
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node "$scriptDir\server\server.js"
} else {
    & cmd /c agy-node.cmd "$scriptDir\server\server.js"
}
