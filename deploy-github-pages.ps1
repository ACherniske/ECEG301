# GitHub Pages Deployment Script for Windows PowerShell
# This script builds and deploys the frontend to GitHub Pages using the gh-pages branch

Write-Host "🚀 Starting GitHub Pages deployment to gh-pages branch..." -ForegroundColor Green

# Get script directory and navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Change to frontend directory
Set-Location "frontend\provider-portal"

# Check if gh-pages is installed
$ghPagesInstalled = npm list gh-pages 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Installing gh-pages..." -ForegroundColor Yellow
    npm install --save-dev gh-pages
}

Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
npm run clean 2>$null

Write-Host "📋 Current git status:" -ForegroundColor Cyan
git status --short

Write-Host "🔨 Building application for production..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:VITE_BASE_PATH = "/ECEG301"
$env:VITE_APP_ENV = "production"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📁 Build contents:" -ForegroundColor Cyan
    Get-ChildItem dist -Name
    
    Write-Host "🚀 Deploying to gh-pages branch..." -ForegroundColor Yellow
    npm run deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Your site will be available at: https://acherniske.github.io/ECEG301/" -ForegroundColor Cyan
        Write-Host "📦 Deployed to gh-pages branch" -ForegroundColor Cyan
        Write-Host "⏰ Note: It may take a few minutes for changes to appear." -ForegroundColor Yellow
        
        Write-Host ""
        Write-Host "🔗 Next steps:" -ForegroundColor Magenta
        Write-Host "   1. Go to GitHub repo → Settings → Pages" -ForegroundColor White
        Write-Host "   2. Set Source to 'Deploy from a branch'" -ForegroundColor White
        Write-Host "   3. Select 'gh-pages' branch and '/ (root)' folder" -ForegroundColor White
        Write-Host "   4. Save and wait for deployment" -ForegroundColor White
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "🔍 Check the error above and ensure:" -ForegroundColor Yellow
        Write-Host "   - You have push access to the repository" -ForegroundColor White
        Write-Host "   - Git is configured with your credentials" -ForegroundColor White
        Write-Host "   - The repository exists on GitHub" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "🔍 Check the build errors above and fix them first" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Script completed!" -ForegroundColor Green
