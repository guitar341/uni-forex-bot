#!/bin/bash
# MT5 Bridge Downloader and Installer

echo "🚀 Uni Forex Bot - MT5 Bridge Installer"
echo "======================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)
        PLATFORM="linux"
        EXTENSION=""
        ;;
    Darwin*)
        PLATFORM="macos"
        EXTENSION=""
        ;;
    MINGW*|MSYS*|CYGWIN*)
        PLATFORM="windows"
        EXTENSION=".exe"
        ;;
    *)
        echo "❌ Unsupported operating system: ${OS}"
        exit 1
        ;;
esac

echo "📦 Detected platform: $PLATFORM"
echo ""

# Create mt5-bridge directory
BRIDGE_DIR="mt5-bridge"
if [ -d "$BRIDGE_DIR" ]; then
    echo "⚠️  Directory $BRIDGE_DIR already exists"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$BRIDGE_DIR"
    else
        echo "❌ Installation cancelled"
        exit 1
    fi
fi

mkdir -p "$BRIDGE_DIR"
cd "$BRIDGE_DIR"

echo "📥 Downloading MT5 Bridge for $PLATFORM..."
echo ""

# Download URLs (replace with actual release URLs)
BASE_URL="https://github.com/guitar341/mt5-bridge/releases/download/v1.0.0"

case "$PLATFORM" in
    linux)
        FILENAME="mt5-bridge-linux-x64.tar.gz"
        ;;
    macos)
        FILENAME="mt5-bridge-macos-x64.tar.gz"
        ;;
    windows)
        FILENAME="mt5-bridge-windows-x64.zip"
        ;;
esac

echo "🔗 Download URL: $BASE_URL/$FILENAME"
echo ""

# Download file
if ! command -v curl &> /dev/null; then
    if ! command -v wget &> /dev/null; then
        echo "❌ Please install curl or wget to download the bridge"
        exit 1
    fi
    echo "⬇️  Downloading with wget..."
    wget -q --show-progress "$BASE_URL/$FILENAME"
else
    echo "⬇️  Downloading with curl..."
    curl -# -L "$BASE_URL/$FILENAME" -o "$FILENAME"
fi

if [ ! -f "$FILENAME" ]; then
    echo "❌ Download failed"
    exit 1
fi

echo ""
echo "✅ Download complete"
echo ""
echo "📦 Extracting files..."
echo ""

# Extract files
if [[ $FILENAME == *.zip ]]; then
    unzip -q "$FILENAME"
    rm "$FILENAME"
else
    tar -xzf "$FILENAME"
    rm "$FILENAME"
fi

echo "✅ Extraction complete"
echo ""
echo "🔧 Setting permissions..."

if [ "$PLATFORM" != "windows" ]; then
    chmod +x "mt5-bridge$EXTENSION"
fi

echo ""
echo "✅ MT5 Bridge installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure MetaTrader 5 is installed and running"
echo "2. Run: ./mt5-bridge$EXTENSION"
echo "3. You should see: '✅ MT5 Bridge started on port 8080'"
echo "4. Open http://localhost:3000 and connect to MT5"
echo ""
echo "💡 Tip: Keep the MT5 Bridge running while using the bot"
echo ""
