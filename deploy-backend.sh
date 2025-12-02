#!/bin/bash
# Deploy Backend to AWS Elastic Beanstalk
# Quick deployment script for Bash/Linux/Mac

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AWS Backend Deployment...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install: pip install awscli${NC}"
    exit 1
else
    echo -e "${GREEN}✅ AWS CLI detected${NC}"
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI not found. Please install: pip install awsebcli${NC}"
    exit 1
else
    echo -e "${GREEN}✅ EB CLI detected${NC}"
fi

# Navigate to backend directory
echo -e "${YELLOW}📁 Navigating to backend directory...${NC}"
cd backend

# Check if already initialized
if [ -d ".elasticbeanstalk" ]; then
    echo -e "${GREEN}✅ Elastic Beanstalk already initialized${NC}"
    
    # Deploy
    echo -e "${YELLOW}🚀 Deploying to existing environment...${NC}"
    eb deploy
else
    echo -e "${YELLOW}🔧 Initializing Elastic Beanstalk...${NC}"
    
    # Initialize EB (this will prompt for configuration)
    eb init
    
    echo -e "${YELLOW}🏗️ Creating production environment...${NC}"
    
    # Create and deploy
    eb create production-api
fi

# Set environment variables
echo -e "${YELLOW}⚙️ Setting environment variables...${NC}"

# Basic environment variables
eb setenv NODE_ENV=production
eb setenv FRONTEND_URL=https://acherniske.github.io

# Prompt for secrets
echo -e "${YELLOW}🔐 Please enter your production secrets:${NC}"

read -p "Enter JWT_SECRET (minimum 64 characters): " jwt_secret
if [ ! -z "$jwt_secret" ]; then
    eb setenv JWT_SECRET="$jwt_secret"
fi

read -p "Enter EMAIL_USER: " email_user
if [ ! -z "$email_user" ]; then
    eb setenv EMAIL_USER="$email_user"
fi

read -s -p "Enter EMAIL_APP_PASSWORD: " email_password
echo
if [ ! -z "$email_password" ]; then
    eb setenv EMAIL_APP_PASSWORD="$email_password"
fi

# Deploy with new environment variables
echo -e "${YELLOW}🚀 Deploying with environment variables...${NC}"
eb deploy

# Get application info
echo -e "${GREEN}📋 Getting application information...${NC}"
eb status

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your API is now live! Use 'eb open' to view in browser${NC}"

# Instructions for frontend update
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Get your API URL with: eb status${NC}"
echo -e "${YELLOW}2. Update frontend/.env.production with your new API URL${NC}"
echo -e "${YELLOW}3. Redeploy frontend with: npm run deploy${NC}"
echo -e "${YELLOW}4. Test your full-stack application!${NC}"

echo -e "${GREEN}🎉 Deployment script finished!${NC}"
