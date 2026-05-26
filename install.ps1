#!/usr/bin/env pwsh
# Alloy Installer for Windows
param([switch]$Dev)

$REPO = "the-X-alien/alloy"
$INSTALL_DIR = "$env:USERPROFILE\alloy"

Write-Host "Installing Alloy..." -ForegroundColor Cyan

# Check prerequisites
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "Error: Node.js is required. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js found: $(node --version)" -ForegroundColor Green

# Clone or pull
if (Test-Path $INSTALL_DIR) {
    Write-Host "Updating existing installation..." -ForegroundColor Yellow
    Push-Location $INSTALL_DIR
    git pull
} else {
    Write-Host "Cloning repository..." -ForegroundColor Yellow
    git clone "https://github.com/$REPO.git" $INSTALL_DIR
    Push-Location $INSTALL_DIR
}

# Install dependencies and build
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --ignore-scripts

Write-Host "Building..." -ForegroundColor Yellow
npx tsup

# Link globally
Write-Host "Linking globally..." -ForegroundColor Yellow
npm link

Pop-Location

Write-Host ""
Write-Host "Alloy installed!" -ForegroundColor Green
Write-Host "Run 'alloy' from any terminal to start." -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick start:" -ForegroundColor White
Write-Host "  set ANTHROPIC_API_KEY=sk-ant-..." -ForegroundColor Gray
Write-Host "  alloy" -ForegroundColor Gray
Write-Host ""
Write-Host "Or import from existing tools:" -ForegroundColor White
Write-Host "  alloy --import" -ForegroundColor Gray
