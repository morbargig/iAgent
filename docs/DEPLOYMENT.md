# Deployment Guide

This guide covers deployment options for the iAgent AI Chat Application, including GitHub Pages, Netlify, Vercel, and self-hosted solutions.

## 🚀 GitHub Pages Deployment (Recommended for Frontend)

GitHub Pages provides free static site hosting perfect for the React frontend.

### Prerequisites

- GitHub repository with your code
- Admin access to the repository

### Automatic Deployment with GitHub Actions

The project includes a pre-configured GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the main branch.

#### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select "GitHub Actions"
4. Save the configuration

#### 2. Update Repository Name (if needed)

If your repository name is different from `iagent`, update the base path:

```typescript
// apps/frontend/vite.config.ts
base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
```

#### 3. Push to Main Branch

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Actions workflow will automatically:

- Install dependencies
- Build the frontend
- Deploy to GitHub Pages
- Provide a URL like: `https://yourusername.github.io/your-repo-name/`

### Manual GitHub Pages Deployment

If you prefer manual deployment:

```bash
# Build the frontend
npx nx build frontend --prod

# Install gh-pages (one time)
npm install -g gh-pages

# Deploy to GitHub Pages
gh-pages -d dist/apps/frontend
```

## 🌐 Alternative Deployment Options

### Netlify

Netlify offers excellent React deployment with continuous deployment.

#### Automatic Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npx nx build frontend --prod`
3. Set publish directory: `dist/apps/frontend`
4. Deploy automatically on git push

#### Manual Deployment

```bash
# Build the project
npx nx build frontend --prod

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist/apps/frontend
```

### Vercel

Vercel provides excellent React hosting with automatic deployments.

#### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Set build command: `npx nx build frontend --prod`
3. Set output directory: `dist/apps/frontend`
4. Deploy automatically on git push

#### Manual Deployment

```bash
# Build the project
npx nx build frontend --prod

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Firebase Hosting

Google Firebase offers fast global CDN hosting.

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Build the project
npx nx build frontend --prod

# Initialize Firebase
firebase init hosting

# Configure hosting settings:
# - Public directory: dist/apps/frontend
# - Single-page app: Yes
# - Overwrite index.html: No

# Deploy
firebase deploy
```

## 🖥️ Backend Deployment

The NestJS backend requires a Node.js hosting environment.

### Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# Deploy
git push heroku main
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Set build command: `npx nx build backend`
3. Set run command: `node dist/apps/backend/main.js`
4. Configure environment variables

### Docker Deployment

#### Frontend Dockerfile

```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build frontend --prod

# Nginx serving
FROM nginx:alpine
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/apps/backend ./

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "main.js"]
```

#### Docker Compose

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CORS_ORIGIN=http://localhost
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## ⚙️ Environment Configuration

### Frontend Environment Variables

Create `.env.production` for production builds:

```bash
# Frontend production environment
VITE_API_BASE_URL=https://your-backend-url.com
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### Backend Environment Variables

```bash
# Backend production environment
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-url.com

# AI Service Configuration
OPENAI_API_KEY=your_production_openai_key
ANTHROPIC_API_KEY=your_production_anthropic_key

# Database (if implemented)
DATABASE_URL=postgresql://user:password@host:port/database

# Security
JWT_SECRET=your_secure_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔒 Security Considerations

### Frontend Security

- **HTTPS Only**: Ensure all deployments use HTTPS
- **Content Security Policy**: Configure CSP headers
- **Environment Variables**: Never expose API keys in frontend code

### Backend Security

- **Environment Variables**: Use secure environment variable management
- **CORS**: Configure CORS for specific domains in production
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Authentication**: Add authentication for production use

### GitHub Pages Specific

```nginx
# _headers file for Netlify/additional security
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

## 📊 Monitoring & Analytics

### Frontend Monitoring

- **Google Analytics**: Add tracking for user interactions
- **Sentry**: Error tracking and performance monitoring
- **Lighthouse**: Performance auditing

### Backend Monitoring

- **Health Checks**: Implement comprehensive health endpoints
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Prometheus metrics for monitoring
- **Alerts**: Set up alerts for errors and performance issues

## 🚀 CI/CD Best Practices

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      # Deployment steps
```

### Deployment Checklist

Before deploying to production:

- [ ] **Environment Variables**: All production environment variables configured
- [ ] **API Keys**: Production API keys set up and secured
- [ ] **CORS**: CORS configured for production domains
- [ ] **Testing**: All tests passing
- [ ] **Performance**: Lighthouse audit scores acceptable
- [ ] **Security**: Security headers configured
- [ ] **Monitoring**: Error tracking and monitoring set up
- [ ] **Backup**: Database backup strategy (if applicable)
- [ ] **SSL**: HTTPS certificates configured
- [ ] **DNS**: Domain names configured and propagated

## 🔧 Troubleshooting

### Common GitHub Pages Issues

**Build Failing:**

```bash
# Check the Actions tab for detailed error logs
# Common fixes:
npm ci --legacy-peer-deps
```

**404 on Refresh:**

```javascript
// Add to public/404.html for SPA routing
<script>
  sessionStorage.redirect = location.href; location.replace(location.origin +
  location.pathname.split('/')[1] + '/');
</script>
```

**Base Path Issues:**

```typescript
// Ensure correct base path in vite.config.ts
base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
```

### Performance Optimization

**Bundle Size:**

```bash
# Analyze bundle size
npx nx build frontend --analyze

# Optimize imports
import { Button } from '@mui/material/Button'; // Specific import
```

**Caching:**

```javascript
// Service worker for caching
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

## 📞 Support

For deployment issues:

1. Check the GitHub Actions logs
2. Review environment variables
3. Test locally with production build
4. Open an issue with deployment details

---

**Choose the deployment option that best fits your needs. GitHub Pages is recommended for frontend-only deployments, while full-stack applications benefit from platforms like Railway, Heroku, or DigitalOcean.**
