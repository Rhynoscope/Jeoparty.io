@echo off
:: Jeoparty.io — Windows Firewall Port 3000 Helper
:: This script allows inbound traffic on TCP Port 3000 for your local Wi-Fi / Private network.

echo ====================================================================
echo   Jeoparty.io — Windows Firewall Port 3000 Helper
echo ====================================================================
echo.

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Administrator privileges required.
    echo Requesting elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo Adding inbound Windows Firewall rule for TCP Port 3000...
netsh advfirewall firewall delete rule name="Jeoparty.io (Port 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="Jeoparty.io (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Port 3000 is now allowed through Windows Firewall!
    echo Phones and other devices on your Wi-Fi can now connect.
) else (
    echo.
    echo [ERROR] Failed to add firewall rule. Please check Windows Defender settings.
)

echo.
pause
