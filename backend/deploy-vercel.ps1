#!/usr/bin/env powershell

# Deploy Provider Backend to Vercel
# This script automates the deployment process

param(
    [string]$Environment = "production",
    [switch]$SetupEnvVars = $false,
    [switch]$Preview = $false
)

Write-Host "🚀 Deploying Provider Backend to Vercel..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Set working directory
Set-Location $PSScriptRoot

# Setup environment variables if requested
if ($SetupEnvVars) {
    Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
    
    # Read from .env.vercel file
    if (Test-Path ".env.vercel") {
        $envVars = Get-Content ".env.vercel" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" }
        
        foreach ($line in $envVars) {
            if ($line -match "^([^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Skip empty values
                if ($value -ne "") {
                    Write-Host "Setting $name..." -ForegroundColor Cyan
                    
                    try {
                        vercel env add $name $value --force
                        Write-Host "✅ $name set successfully" -ForegroundColor Green
                    } catch {
                        Write-Host "⚠️  Failed to set $name" -ForegroundColor Yellow
                    }
                }
            }
        }
    } else {
        Write-Host "❌ .env.vercel file not found" -ForegroundColor Red
        exit 1
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow

if ($Preview) {
    Write-Host "Deploying preview..." -ForegroundColor Cyan
    vercel
} else {
    Write-Host "Deploying to production..." -ForegroundColor Cyan
    vercel --prod
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test the deployed API endpoints" -ForegroundColor White
    Write-Host "2. Update your frontend to use the new Vercel URL" -ForegroundColor White
    Write-Host "3. Configure any custom domains if needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitor your deployment at: https://vercel.com/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green
