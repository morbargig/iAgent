#!/bin/bash

# Deploy to GitHub Pages script
# Run this script to deploy the frontend to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting GitHub Pages deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if gh-pages is installed
if ! command -v gh-pages &> /dev/null; then
    echo "📦 Installing gh-pages..."
    npm install -g gh-pages
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/apps/frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the frontend
echo "🏗️ Building frontend for production..."
npx nx build frontend --prod

# Check if build was successful
if [ ! -d "dist/apps/frontend" ]; then
    echo "❌ Error: Build failed, dist/apps/frontend not found"
    exit 1
fi

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."
gh-pages -d dist/apps/frontend -m "Deploy $(date)"

echo "✅ Deployment complete!"
echo "🔗 Your site will be available at: https://$(git config user.name).github.io/$(basename $(git rev-parse --show-toplevel))/"
echo "⏳ Note: It may take a few minutes for changes to appear" 