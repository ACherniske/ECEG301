# Deploy Backend to AWS Elastic Beanstalk
# Quick deployment script for Windows PowerShell

# Colors for output
$Green = "Green"
$Yellow = "Yellow" 
$Red = "Red"

Write-Host "🚀 Starting AWS Backend Deployment..." -ForegroundColor $Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI detected" -ForegroundColor $Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install: pip install awscli" -ForegroundColor $Red
    exit 1
}

# Check if EB CLI is installed
try {
    eb --version | Out-Null
    Write-Host "✅ EB CLI detected" -ForegroundColor $Green
} catch {
    Write-Host "❌ EB CLI not found. Please install: pip install awsebcli" -ForegroundColor $Red
    exit 1
}

# Navigate to backend directory
Write-Host "📁 Navigating to backend directory..." -ForegroundColor $Yellow
cd backend

# Check if already initialized
if (Test-Path ".elasticbeanstalk") {
    Write-Host "✅ Elastic Beanstalk already initialized" -ForegroundColor $Green
    
    # Deploy
    Write-Host "🚀 Deploying to existing environment..." -ForegroundColor $Yellow
    eb deploy
} else {
    Write-Host "🔧 Initializing Elastic Beanstalk..." -ForegroundColor $Yellow
    
    # Initialize EB (this will prompt for configuration)
    eb init
    
    Write-Host "🏗️ Creating production environment..." -ForegroundColor $Yellow
    
    # Create and deploy
    eb create production-api
}

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor $Yellow

# Basic environment variables
eb setenv NODE_ENV=production
eb setenv FRONTEND_URL=https://acherniske.github.io

# Prompt for secrets
Write-Host "🔐 Please enter your production secrets:" -ForegroundColor $Yellow

$jwtSecret = Read-Host "Enter JWT_SECRET (minimum 64 characters)"
if ($jwtSecret) {
    eb setenv JWT_SECRET=$jwtSecret
}

$emailUser = Read-Host "Enter EMAIL_USER"
if ($emailUser) {
    eb setenv EMAIL_USER=$emailUser
}

$emailPassword = Read-Host "Enter EMAIL_APP_PASSWORD" -AsSecureString
if ($emailPassword) {
    $emailPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword))
    eb setenv EMAIL_APP_PASSWORD=$emailPasswordPlain
}

# Deploy with new environment variables
Write-Host "🚀 Deploying with environment variables..." -ForegroundColor $Yellow
eb deploy

# Get application info
Write-Host "📋 Getting application information..." -ForegroundColor $Green
eb status

Write-Host "✅ Deployment complete!" -ForegroundColor $Green
Write-Host "🌐 Your API is now live! Use 'eb open' to view in browser" -ForegroundColor $Green

# Instructions for frontend update
Write-Host "📝 Next steps:" -ForegroundColor $Yellow
Write-Host "1. Get your API URL with: eb status" -ForegroundColor $Yellow
Write-Host "2. Update frontend/.env.production with your new API URL" -ForegroundColor $Yellow
Write-Host "3. Redeploy frontend with: npm run deploy" -ForegroundColor $Yellow
Write-Host "4. Test your full-stack application!" -ForegroundColor $Yellow

Write-Host "🎉 Deployment script finished!" -ForegroundColor $Green
