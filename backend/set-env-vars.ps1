#!/usr/bin/env powershell

# Set Vercel Environment Variables for Provider Backend
# Run this script from the backend directory

param(
    [switch]$Preview,
    [switch]$Development,
    [switch]$Production
)

Write-Host "🔧 Vercel Environment Variable Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create one from .env.example" -ForegroundColor Red
    exit 1
}

# Determine environment
$envFlag = ""
if ($Preview) { $envFlag = "preview" }
elseif ($Development) { $envFlag = "development" }
elseif ($Production) { $envFlag = "production" }
else { $envFlag = "production" }

Write-Host "📌 Setting environment variables for: $envFlag" -ForegroundColor Yellow

# Read .env file and set variables
$envContent = Get-Content ".env" -Raw
$envLines = $envContent -split "`n"

foreach ($line in $envLines) {
    $line = $line.Trim()
    
    # Skip comments and empty lines
    if ($line -eq "" -or $line.StartsWith("#")) {
        continue
    }
    
    # Parse key=value
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove surrounding quotes if present
        if ($value -match "^['""](.*)['"""]$") {
            $value = $matches[1]
        }
        
        # Skip empty values
        if ($value -eq "" -or $value -eq "your-*") {
            Write-Host "⚠️  Skipping $key (empty or placeholder value)" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "Setting $key..." -ForegroundColor Cyan
        
        try {
            # Use echo to pipe the value to vercel env add
            $value | vercel env add $key $envFlag --yes 2>&1 | Out-Null
            Write-Host "✅ $key set successfully" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Failed to set $key - it may already exist" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Environment variable setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'vercel env ls' to verify your variables" -ForegroundColor White
Write-Host "2. Run 'vercel --prod' to deploy to production" -ForegroundColor White
Write-Host ""
