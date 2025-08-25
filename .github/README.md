# 🔄 GitHub Workflows

This directory contains automated workflows for the iAgent project.

## 📋 Available Workflows

### 🔍 CI - Continuous Integration (`ci.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests to `main`
- **Purpose**: Code quality checks, testing, and build verification
- **Jobs**:
  - 🧹 **Quality**: ESLint + TypeScript checking
  - 🧪 **Test**: Unit tests with coverage
  - 🏗️ **Build**: Production build verification
  - 🔒 **Security**: npm audit security scan

### 🚀 Deploy to GitHub Pages (`deploy-gh-pages.yml`)
- **Triggers**: Push to `main` (after CI), Manual dispatch
- **Purpose**: Deploy frontend to GitHub Pages
- **Features**:
  - ✅ Production build with optimizations
  - 🔧 Automatic GitHub Pages configuration
  - 🌐 Deployment verification
  - 📊 Build size analysis

## 🎯 Deployment Process

### Automatic Deployment
1. Push changes to `main` branch
2. CI workflow runs automatically
3. If CI passes, GitHub Pages deployment starts
4. Frontend is built and deployed to: `https://<username>.github.io/iagent/`

### Manual Deployment
```bash
# Local deployment (requires gh-pages CLI)
npm run deploy:local

# Or trigger GitHub Actions manually
gh workflow run deploy-gh-pages.yml
```

## 🔧 Configuration

### Environment Variables
The workflows use these environment variables for GitHub Pages:
- `VITE_BASE_URL`: `/iagent/` (GitHub Pages subdirectory)
- `VITE_API_BASE_URL`: `/iagent/api/` (API endpoint path)
- `VITE_ENVIRONMENT`: `production`

### GitHub Pages Setup
1. Go to repository **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. The workflow will handle deployment automatically

## 📊 Workflow Status

You can monitor workflow runs in the **Actions** tab of your repository:
- ✅ Green checkmark: All jobs passed
- ❌ Red X: Some jobs failed
- 🟡 Yellow dot: In progress
- ⚪ Gray dot: Not run

## 🆘 Troubleshooting

### Common Issues

**Build Fails**
- Check TypeScript errors in CI logs
- Ensure all dependencies are properly installed
- Verify environment variables are set correctly

**Deployment Fails**
- Check GitHub Pages settings are configured
- Verify repository has Pages enabled
- Ensure workflows have proper permissions

**Tests Fail**
- Review test output in CI logs
- Check if all test dependencies are available
- Verify test environment setup

### Getting Help

1. Check the **Actions** tab for detailed logs
2. Review the specific job that failed
3. Look for error messages in the workflow output
4. Check if the issue is related to dependencies or configuration

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Nx Documentation](https://nx.dev)
- [Vite Documentation](https://vitejs.dev)
