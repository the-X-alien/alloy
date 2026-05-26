#!/usr/bin/env bash
# Alloy Installer for macOS/Linux
set -e

REPO="the-X-alien/alloy"
INSTALL_DIR="$HOME/alloy"

echo "Installing Alloy..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required. Install from https://nodejs.org"
    exit 1
fi

echo "Node.js found: $(node --version)"

# Clone or pull
if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone "https://github.com/$REPO.git" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies and build
echo "Installing dependencies..."
npm install --ignore-scripts

echo "Building..."
npx tsup

# Link globally
echo "Linking globally..."
npm link

echo ""
echo "Alloy installed!"
echo "Run 'alloy' from any terminal to start."
echo ""
echo "Quick start:"
echo "  export ANTHROPIC_API_KEY=sk-ant-..."
echo "  alloy"
echo ""
echo "Or import from existing tools:"
echo "  alloy --import"
