# 🚀 Deployment Guide

This guide explains how to deploy the iAgent application to GitHub Pages using GitHub Actions.

## 📋 Prerequisites

1. **GitHub Repository**: Your repository must be public or you need GitHub Pro for private repository deployment
2. **GitHub Pages Enabled**: Enable GitHub Pages in your repository settings
3. **GitHub Actions**: Ensure GitHub Actions are enabled for your repository

## 🔧 Setup GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Choose **gh-pages** branch and **/(root)** folder
6. Click **Save**

## 🚀 Automatic Deployment

The application automatically deploys to GitHub Pages when you push to the `main` branch. The deployment process:

1. **Trigger**: Push to `main` branch or manual workflow dispatch
2. **Build**: Frontend is built using Nx and Vite
3. **Deploy**: Built files are deployed to the `gh-pages` branch
4. **Verify**: Basic connectivity test is performed

## 📁 Deployment Files

The following files are automatically created during deployment:

- `.nojekyll` - Bypasses Jekyll processing
- `robots.txt` - Search engine directives
- All built frontend assets

## 🌐 Deployment URL

Your application will be available at:
```
https://{username}.github.io/iAgent/
```

Replace `{username}` with your GitHub username.

## 🔍 Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab in your repository
2. Select **🚀 Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

## 📊 Build Configuration

The frontend is built with the following configuration:

- **Base URL**: `/iAgent/` (for GitHub Pages)
- **Environment**: Production
- **Build Tool**: Nx + Vite
- **Output Directory**: `dist/apps/frontend`

## 🛠️ Troubleshooting

### Build Failures

1. Check the GitHub Actions logs for errors
2. Ensure all dependencies are properly installed
3. Verify the Nx configuration is correct

### Deployment Issues

1. Check if GitHub Pages is enabled
2. Verify the `gh-pages` branch exists
3. Check repository permissions for GitHub Actions

### 404 Errors

1. Ensure the base URL is correctly set to `/iAgent/`
2. Check if the `gh-pages` branch contains the built files
3. Wait a few minutes for GitHub Pages to update

## 📝 Environment Variables

The following environment variables are set during build:

- `VITE_BASE_URL`: `/iAgent/`
- `VITE_API_BASE_URL`: `/iAgent/api`
- `VITE_ENVIRONMENT`: `production`

## 🔄 Workflow Files

- **`.github/workflows/deploy-gh-pages.yml`**: Main deployment workflow
- **`.github/workflows/ci.yml`**: Continuous Integration
- **`.github/workflows/cd.yml`**: Continuous Deployment (advanced)

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx Documentation](https://nx.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review this deployment guide
3. Check the repository issues
4. Create a new issue with detailed error information
