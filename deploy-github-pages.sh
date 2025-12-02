#!/bin/bash

# GitHub Pages Deployment Script (gh-pages branch approach)
# This script builds and deploys the frontend to GitHub Pages using the gh-pages branch

echo "🚀 Starting GitHub Pages deployment to gh-pages branch..."

# Ensure we're in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Change to frontend directory
cd frontend/provider-portal

# Check if gh-pages is installed
if ! npm list gh-pages > /dev/null 2>&1; then
    echo "📦 Installing gh-pages..."
    npm install --save-dev gh-pages
fi

echo "🧹 Cleaning previous build..."
npm run clean 2>/dev/null || true

echo "📋 Current git status:"
git status --short

echo "🔨 Building application for production..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build contents:"
    ls -la dist/
    
    echo "🚀 Deploying to gh-pages branch..."
    npm run deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Your site will be available at: https://acherniske.github.io/ECEG301/"
        echo "📦 Deployed to gh-pages branch"
        echo "⏰ Note: It may take a few minutes for changes to appear."
        
        echo ""
        echo "🔗 Next steps:"
        echo "   1. Go to GitHub repo → Settings → Pages"
        echo "   2. Set Source to 'Deploy from a branch'"
        echo "   3. Select 'gh-pages' branch and '/ (root)' folder"
        echo "   4. Save and wait for deployment"
    else
        echo "❌ Deployment failed!"
        echo "🔍 Check the error above and ensure:"
        echo "   - You have push access to the repository"
        echo "   - Git is configured with your credentials"
        echo "   - The repository exists on GitHub"
        exit 1
    fi
else
    echo "❌ Build failed!"
    echo "🔍 Check the build errors above and fix them first"
    exit 1
fi
