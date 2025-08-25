#!/bin/bash

# 🚀 GitHub Pages Deployment Script
# This script provides a local way to deploy to GitHub Pages
# Normally, the GitHub Actions workflow handles deployment automatically

set -e  # Exit on any error

echo "🚀 Starting GitHub Pages deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Get repository info
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login' 2>/dev/null || git config user.name || echo "unknown")
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/apps/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the frontend with GitHub Pages configuration
echo "🏗️ Building frontend for GitHub Pages..."
VITE_BASE_URL="/iagent/" VITE_ENVIRONMENT="production" npx nx build frontend --configuration=production

# Verify build
if [ ! -d "dist/apps/frontend" ]; then
    echo "❌ Error: Build failed, dist/apps/frontend not found"
    exit 1
fi

if [ ! -f "dist/apps/frontend/index.html" ]; then
    echo "❌ Error: index.html not found in build output"
    exit 1
fi

echo "✅ Build successful!"
echo "📊 Build size: $(du -sh dist/apps/frontend)"

# Check if gh-pages CLI is available
if command -v gh-pages &> /dev/null; then
    echo "🌐 Deploying using gh-pages CLI..."
    
    # Add deployment preparation files
    cd dist/apps/frontend
    touch .nojekyll
    echo "User-agent: *\nAllow: /" > robots.txt
    cd ../../..
    
    # Deploy using gh-pages
    gh-pages -d dist/apps/frontend -m "🚀 Deploy $(date)"
    
    echo "✅ Deployment complete!"
    echo "🔗 Your site will be available at: https://$REPO_OWNER.github.io/iagent/"
    echo "⏳ Note: It may take a few minutes for changes to appear"
    
elif command -v git &> /dev/null; then
    echo "📢 GitHub Pages CLI not found."
    echo "💡 To deploy manually:"
    echo "1. Push your changes to the main branch"
    echo "2. The GitHub Actions workflow will automatically deploy"
    echo ""
    echo "Or install gh-pages CLI: npm install -g gh-pages"
    
else
    echo "❌ Error: Git not found"
    exit 1
fi

echo ""
echo "🎉 Deployment process completed!"
echo "📖 Learn more about GitHub Pages: https://docs.github.com/en/pages"