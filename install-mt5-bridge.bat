@echo off
REM MT5 Bridge Downloader and Installer for Windows

echo.
echo 🚀 Uni Forex Bot - MT5 Bridge Installer
echo =======================================
echo.

set PLATFORM=windows
set EXTENSION=.exe
set BRIDGE_DIR=mt5-bridge

echo 📦 Detected platform: %PLATFORM%
echo.

if exist "%BRIDGE_DIR%" (
    echo ⚠️  Directory %BRIDGE_DIR% already exists
    set /p CONFIRM="Overwrite? (y/n): "
    if /i "%CONFIRM%"=="y" (
        rmdir /s /q "%BRIDGE_DIR%"
    ) else (
        echo ❌ Installation cancelled
        pause
        exit /b 1
    )
)

mkdir "%BRIDGE_DIR%"
cd /d "%BRIDGE_DIR%"

echo 📥 Downloading MT5 Bridge for %PLATFORM%...
echo.

set BASE_URL=https://github.com/guitar341/mt5-bridge/releases/download/v1.0.0
set FILENAME=mt5-bridge-windows-x64.zip

echo 🔗 Download URL: %BASE_URL%/%FILENAME%
echo.
echo ⬇️  Downloading...
echo.

if exist powershell.exe (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%BASE_URL%/%FILENAME%' -OutFile '%FILENAME%'"
) else (
    echo ❌ PowerShell not found. Please download MT5 Bridge manually.
    pause
    exit /b 1
)

if not exist "%FILENAME%" (
    echo ❌ Download failed
    pause
    exit /b 1
)

echo.
echo ✅ Download complete
echo.
echo 📦 Extracting files...
echo.

powershell -Command "Expand-Archive -Path '%FILENAME%' -DestinationPath '.'"
del "%FILENAME%"

echo ✅ Extraction complete
echo.
echo ✅ MT5 Bridge installed successfully!
echo.
echo 📋 Next steps:
echo 1. Make sure MetaTrader 5 is installed and running
echo 2. Double-click: mt5-bridge.exe
echo 3. You should see: '✅ MT5 Bridge started on port 8080'
echo 4. Open http://localhost:3000 and connect to MT5
echo.
echo 💡 Tip: Keep the MT5 Bridge running while using the bot
echo.
pause
