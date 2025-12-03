# Comprehensive GitHub Pages Deployment Script - Windows PowerShell
# This script builds and deploys both portals to GitHub Pages using the gh-pages branch

param(
    [string]$Portal = "all"  # "provider", "driver", or "all"
)

Write-Host "Starting GitHub Pages deployment..." -ForegroundColor Green

# Get script directory and navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Deploy-Portal {
    param(
        [string]$PortalName,
        [string]$PortalPath,
        [string]$BasePath,
        [string]$Url,
        [string]$Dest
    )
    
    Write-Host "Deploying $PortalName..." -ForegroundColor Magenta
    
    # Always start from script directory
    Set-Location $ScriptDir
    Set-Location $PortalPath
    
    # Ensure dependencies are installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies for $PortalName..." -ForegroundColor Yellow
        npm install
    }
    
    # Clean dist folder using PowerShell (more reliable on Windows)
    Write-Host "Cleaning previous build for $PortalName..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    
    Write-Host "Building $PortalName for production..." -ForegroundColor Yellow
    $env:NODE_ENV = "production"
    $env:VITE_BASE_PATH = $BasePath
    $env:VITE_APP_ENV = "production"
    npx vite build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$PortalName build successful!" -ForegroundColor Green
        
        Write-Host "Deploying $PortalName to gh-pages branch (subdirectory: $Dest)..." -ForegroundColor Yellow
        # Use --add flag to preserve other directories on gh-pages branch
        npx gh-pages -d dist -b gh-pages --dest $Dest --add
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "$PortalName deployment successful!" -ForegroundColor Green
            Write-Host "$PortalName will be available at: $Url" -ForegroundColor Cyan
        } else {
            Write-Host "$PortalName deployment failed!" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "$PortalName build failed!" -ForegroundColor Red
        return $false
    }
    
    # Return to script directory
    Set-Location $ScriptDir
    return $true
}

$success = $true

# Deploy root landing page first (only if deploying all)
if ($Portal -eq "all") {
    Write-Host "Deploying root landing page..." -ForegroundColor Magenta
    Set-Location $ScriptDir
    # Run gh-pages from a portal directory that has it installed, pointing to the root landing page
    Push-Location "frontend\provider-portal"
    $rootPath = Resolve-Path "$ScriptDir\gh-pages-root"
    npx gh-pages -d $rootPath -b gh-pages --add
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Root landing page deployed!" -ForegroundColor Green
    } else {
        Write-Host "Root landing page deployment failed!" -ForegroundColor Red
    }
    Pop-Location
}

if ($Portal -eq "provider" -or $Portal -eq "all") {
    $result = Deploy-Portal -PortalName "Provider Portal" -PortalPath "frontend\provider-portal" -BasePath "/ECEG301/provider/" -Url "https://acherniske.github.io/ECEG301/provider/" -Dest "provider"
    if (-not $result) { $success = $false }
}

if ($Portal -eq "driver" -or $Portal -eq "all") {
    $result = Deploy-Portal -PortalName "Driver Portal" -PortalPath "frontend\driver-portal" -BasePath "/ECEG301/driver/" -Url "https://acherniske.github.io/ECEG301/driver/" -Dest "driver"
    if (-not $result) { $success = $false }
}

if ($success) {
    Write-Host "All deployments completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Magenta
    Write-Host "   1. Go to GitHub repo - Settings - Pages" -ForegroundColor White
    Write-Host "   2. Set Source to 'Deploy from a branch'" -ForegroundColor White
    Write-Host "   3. Select 'gh-pages' branch and '/ (root)' folder" -ForegroundColor White
    Write-Host "   4. Save and wait for deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "Your applications will be available at:" -ForegroundColor Cyan
    Write-Host "   Landing Page: https://acherniske.github.io/ECEG301/" -ForegroundColor White
    if ($Portal -eq "provider" -or $Portal -eq "all") {
        Write-Host "   Provider Portal: https://acherniske.github.io/ECEG301/provider/" -ForegroundColor White
    }
    if ($Portal -eq "driver" -or $Portal -eq "all") {
        Write-Host "   Driver Portal: https://acherniske.github.io/ECEG301/driver/" -ForegroundColor White
    }
} else {
    Write-Host "Some deployments failed. Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "Deployment script completed!" -ForegroundColor Green
