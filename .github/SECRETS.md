# 🔐 GitHub Actions Secrets Configuration

This document outlines all the secrets and environment variables that need to be configured in GitHub Actions for the iAgent project.

> **Note**: This application uses MongoDB as the primary database. All database credentials are included in the MongoDB connection string (`MONGODB_URI`).

## 📋 Required Secrets

These secrets **MUST** be configured for the application to work in GitHub Actions workflows:

### 🔒 Critical Secrets (Always Required)

| Secret Name | Description | Example | Where to Set |
|------------|-------------|---------|--------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | GitHub Secrets |
| `JWT_SECRET` | Secret key for JWT token signing | Random string (use `openssl rand -base64 32`) | GitHub Secrets |

### 🛠️ Configuration Variables (Required for Production)

| Secret Name | Description | Example | Default |
|------------|-------------|---------|---------|
| `API_URL` | Backend API URL | `https://api.iagent.com` | `http://localhost:3030/api` |
| `FRONTEND_URL` | Frontend URL | `https://iagent.com` | `http://localhost:3000` |
| `DB_NAME` | MongoDB database name | `filesdb` | `filesdb` |

### 🚀 Deployment Secrets (Required for CI/CD)

| Secret Name | Description | Example | Where to Set |
|------------|-------------|---------|--------------|
| `RENDER_DEPLOY_HOOK` | Render deploy hook URL for triggering backend deployments | `https://api.render.com/deploy/srv-xxx?key=xxx` | GitHub Secrets |

### 🔧 Optional Secrets

| Secret Name | Description | Example | Default |
|------------|-------------|---------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `1h`, `24h` | `24h` |
| `MAX_FILE_SIZE` | Max file upload size (bytes) | `5242880` | `5242880` (5MB) |
| `MAX_TOTAL_SIZE` | Max total upload size (bytes) | `52428800` | `52428800` (50MB) |
| `MAX_FILE_COUNT` | Max number of files | `8` | `8` |
| `ACCEPTED_FILE_TYPES` | Comma-separated file types | `.pdf,.doc,.docx` | Empty (all types) |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://domain1.com,https://domain2.com` | See env files |
| `ENABLE_SWAGGER` | Enable Swagger UI | `true`, `false` | `true` |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` | `info` (prod), `debug` (dev) |

## 🚀 Setting Up Secrets in GitHub

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### Step 2: Add New Secrets

1. Click **New repository secret**
2. Enter the secret name (exactly as listed above)
3. Enter the secret value
4. Click **Add secret**

### Step 3: Verify Secrets

After adding secrets, they will appear in the list as masked values (showing only `••••••••`). You can verify they're set correctly by:
- Checking the list shows all required secrets
- Running a workflow and checking logs (values are automatically masked in logs)

## 📝 Environment-Specific Configuration

### Development/CI Environment

For CI workflows (testing, linting, building):

```yaml
env:
  NODE_ENV: development
  # Use test/dummy values or minimal required secrets
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Production Deployment

For production deployments (Render, Railway, etc.):

```yaml
env:
  NODE_ENV: production
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  API_URL: ${{ secrets.API_URL }}
  FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
  ENABLE_SWAGGER: ${{ secrets.ENABLE_SWAGGER || 'true' }}
  RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Render Backend Deployment

For automated backend deployments to Render:

```yaml
env:
  RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Note**: The Render deploy hook URL can be found in your Render dashboard under the service settings → "Manual Deploy" section. The workflow will use this hook to trigger deployments automatically when backend code changes are pushed to the main branch.

## 🔍 Using Secrets in Workflows

### Basic Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      MONGODB_URI: ${{ secrets.MONGODB_URI }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - name: Build application
        run: npm run build
```

### Conditional Secrets

```yaml
env:
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

**Note**: To use local MongoDB, simply set `MONGODB_URI` to your local connection string (e.g., `mongodb://localhost:27017`).

### Matrix Strategy with Secrets

```yaml
strategy:
  matrix:
    env: [development, production]
env:
  NODE_ENV: ${{ matrix.env }}
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

## ⚠️ Security Best Practices

### ✅ DO:

- ✅ Use GitHub Secrets for all sensitive data
- ✅ Use strong, randomly generated secrets (especially `JWT_SECRET`)
- ✅ Rotate secrets periodically
- ✅ Use different secrets for development and production
- ✅ Review secret access regularly
- ✅ Use environment-specific values

### ❌ DON'T:

- ❌ Commit secrets to the repository
- ❌ Hardcode secrets in workflow files
- ❌ Share secrets in logs or outputs
- ❌ Use the same secrets across all environments
- ❌ Use weak or predictable secrets
- ❌ Expose secrets in pull request comments

## 🔄 Secret Rotation

### When to Rotate:

- Periodically (every 90 days recommended)
- After a security incident
- When team members leave
- When secrets are accidentally exposed

### How to Rotate:

1. Generate new secret values
2. Update secrets in GitHub repository settings
3. Update any external services using the same secrets
4. Test the application with new secrets
5. Delete old secrets (optional, but recommended)

## 🧪 Testing Secrets Configuration

To verify secrets are properly configured:

1. **Check Secret Names**: Ensure all required secrets exist
2. **Test Workflow**: Run a test workflow that uses the secrets
3. **Check Logs**: Verify no "secret not found" errors
4. **Validate Values**: Test that the application starts correctly with the secrets

Example test workflow:

```yaml
name: Test Secrets
on: workflow_dispatch

jobs:
  test-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Check secrets exist
        run: |
          if [ -z "${{ secrets.MONGODB_URI }}" ]; then
            echo "❌ MONGODB_URI secret is missing"
            exit 1
          fi
          if [ -z "${{ secrets.JWT_SECRET }}" ]; then
            echo "❌ JWT_SECRET secret is missing"
            exit 1
          fi
          if [ -z "${{ secrets.RENDER_DEPLOY_HOOK }}" ]; then
            echo "⚠️ RENDER_DEPLOY_HOOK secret is missing (optional for CI/CD)"
          fi
          echo "✅ All required secrets are configured"
```

## 📚 Related Documentation

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Local Environment Setup](./../apps/backend/.env.example) - See `.env.example` for local development
- [Backend Environment Configuration](./../apps/backend/src/environments/) - Environment files
- [Deployment Guide](./../docs/DEPLOYMENT.md) - Deployment-specific configuration
- [Backend Deployment Workflow](./.github/workflows/deploy-backend.yml) - Automated Render deployment workflow

## 🆘 Troubleshooting

### Secret Not Found

**Error**: `Error: JWT_SECRET environment variable is required` or `RENDER_DEPLOY_HOOK secret is missing`

**Solution**: 
1. Verify the secret exists in GitHub repository settings
2. Check the secret name matches exactly (case-sensitive)
3. Ensure the workflow has access to the secret
4. For `RENDER_DEPLOY_HOOK`: Get the deploy hook URL from Render dashboard (Service → Settings → Manual Deploy)

### Secret Value Incorrect

**Error**: Application fails to connect or authenticate

**Solution**:
1. Verify secret values are correct
2. Check for extra whitespace or special characters
3. Test secret values in local environment first

### Secrets Not Masked in Logs

**Issue**: Secret values appear in workflow logs

**Solution**:
1. Ensure secrets are accessed via `${{ secrets.SECRET_NAME }}`
2. Never echo or print secret values directly
3. Use masking in workflow steps

## 📞 Support

If you encounter issues with secrets configuration:

1. Check this documentation first
2. Review GitHub Actions logs for specific errors
3. Verify all required secrets are set
4. Test with a minimal workflow to isolate the issue

---

**Last Updated**: Generated automatically when environment configuration changes

