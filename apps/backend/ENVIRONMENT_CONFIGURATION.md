# Environment Configuration Guide

## Overview
The backend application uses **file replacement** in `project.json` to switch between different environment configurations, similar to Angular's environment setup.

## Environment Files

### Available Environments:
- **Development** (`env.dev.ts`) - Local development environment
- **Staging** (`env.staging.ts`) - Staging/pre-production environment  
- **Test** (`env.test.ts`) - Testing environment
- **Production** (`env.prod.ts`) - Production environment

### Base Environment File:
- **`environment.ts`** - This file gets replaced at build time based on the configuration

## How to Use

### Running with Different Environments:

```bash
# Development (default)
npx nx serve backend
# or explicitly:
npx nx serve backend --configuration=development

# Staging
npx nx serve backend --configuration=staging

# Test
npx nx serve backend --configuration=test

# Production
npx nx serve backend --configuration=production
```

### Building for Different Environments:

```bash
# Development
npx nx build backend --configuration=development

# Staging
npx nx build backend --configuration=staging

# Test
npx nx build backend --configuration=test

# Production
npx nx build backend --configuration=production
```

## How File Replacement Works

1. The `project.json` contains `fileReplacements` configuration for each environment
2. When you build with a specific configuration, Nx replaces `environment.ts` with the corresponding `env.*.ts` file
3. All imports from `./environments/environment` will use the replaced file

Example from `project.json`:
```json
"staging": {
  "fileReplacements": [
    {
      "replace": "apps/backend/src/environments/environment.ts",
      "with": "apps/backend/src/environments/env.staging.ts"
    }
  ]
}
```

## Environment API Endpoint

The backend exposes an `/api/environment` endpoint that returns the current environment configuration (excluding sensitive data):

```bash
curl http://localhost:3001/api/environment
```

**Note**: The global prefix `/api` is automatically added to all routes. The Swagger UI will show the correct URLs without double prefixes.

## Swagger Documentation

The API documentation is available at `/docs` (not `/api/docs`):

```bash
# Swagger UI
http://localhost:3001/docs

# Swagger JSON
http://localhost:3001/docs-json
```

Example response:
```json
{
  "production": false,
  "apiUrl": "https://staging-api.iagent.com",
  "frontendUrl": "https://staging.iagent.com",
  "swagger": {
    "enabled": true,
    "title": "iAgent API - Staging",
    "description": "Staging environment API documentation",
    "version": "1.0.0"
  },
  ...
}
```

## Environment Variables

Each environment file supports runtime environment variable overrides using `process.env`:

### Server Configuration
- `PORT` - Server port (default: 3030)
- `API_URL` - Override the API URL
- `FRONTEND_URL` - Override the frontend URL

### MongoDB Configuration
- `DEMO_MODE` - Use local MongoDB when `true`, remote when `false`
- `MONGODB_URI_LOCAL` - Local MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGODB_URI` - Remote MongoDB connection string (MongoDB Atlas or remote instance)
- `DB_NAME` - MongoDB database name (default: `filesdb`)

### Authentication
- `JWT_SECRET` - JWT secret key for token signing
- `JWT_EXPIRES_IN` - JWT token expiration time

### File Upload Limits
- `MAX_FILE_SIZE` - Maximum single file size in bytes (default: 5242880 = 5MB)
- `MAX_TOTAL_SIZE` - Maximum total size of all files in bytes (default: 52428800 = 50MB)
- `MAX_FILE_COUNT` - Maximum number of files per upload (default: 8)
- `ACCEPTED_FILE_TYPES` - Comma-separated list of accepted MIME types (empty = all types)

### Other Configuration
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` - Database configuration (if using other databases)
- `CORS_ORIGINS` - Comma-separated list of CORS origins
- `ENABLE_SWAGGER` - Enable/disable Swagger documentation
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

Example:
```bash
# With custom API URL
API_URL=https://custom-api.com PORT=3030 npx nx serve backend --configuration=staging

# With MongoDB configuration
MONGODB_URI="mongodb+srv://appuser:password@cluster0.giuoosh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" DB_NAME="filesdb" npx nx serve backend --configuration=development

# With DEMO_MODE enabled (use local Docker MongoDB)
DEMO_MODE=true MONGODB_URI_LOCAL=mongodb://localhost:27017 npx nx serve backend --configuration=development

# With file upload limits
MAX_FILE_SIZE=10485760 MAX_FILE_COUNT=10 npx nx serve backend --configuration=development
```

## MongoDB Setup

### Option 1: Local MongoDB with Docker (Recommended for Development)

1. **Start MongoDB using Docker Compose:**
   ```bash
   # From the project root
   docker-compose up -d
   ```

2. **Set environment variables:**
   ```bash
   export DEMO_MODE=true
   export MONGODB_URI_LOCAL=mongodb://localhost:27017
   export DB_NAME=filesdb
   ```

3. **Start the backend:**
   ```bash
   npx nx serve backend --configuration=development
   ```

4. **Verify MongoDB is running:**
   ```bash
   # Check Docker container
   docker ps | grep mongodb

   # Check backend logs for:
   # 🚀 Connecting to MongoDB (LOCAL)...
   # ✅ MongoDB connected successfully!
   ```

5. **Stop MongoDB:**
   ```bash
   docker-compose down
   ```

6. **Stop and remove data:**
   ```bash
   docker-compose down -v  # Warning: This removes all data!
   ```

### Option 2: Remote MongoDB (Production/Staging)

1. **Set environment variables:**
   ```bash
   export DEMO_MODE=false
   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
   export DB_NAME=filesdb
   ```

2. **Start the backend:**
   ```bash
   npx nx serve backend --configuration=production
   ```

3. **Verify connection:**
   ```bash
   # Check backend logs for:
   # 🚀 Connecting to MongoDB (REMOTE)...
   # ✅ MongoDB connected successfully!
   ```

### MongoDB Connection Modes

The application automatically selects the MongoDB URI based on `DEMO_MODE`:

```typescript
// In environment files:
mongodb: {
  uriLocal: process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017',
  uri: process.env.MONGODB_URI || 'mongodb+srv://...',
  dbName: process.env.DB_NAME || 'filesdb',
  
  // Computed URI based on demo mode
  get activeUri(): string {
    return this.demoMode ? this.uriLocal : this.uri;
  }
}
```

**Behavior:**
- `DEMO_MODE=true` → Uses `uriLocal` (Docker MongoDB)
- `DEMO_MODE=false` → Uses `uri` (Remote MongoDB)
- No MongoDB available → Falls back to in-memory storage (data not persisted)

### File Storage

Files are stored in MongoDB GridFS with the following metadata:
- Original filename
- MIME type
- File size
- SHA-256 content hash
- Upload timestamp
- Chat ID (if attached to a chat)
- User ID

**Deduplication:** Files are only deduplicated if BOTH the content hash AND filename match. This allows users to upload the same file with different names for different purposes.

## File Structure

```
apps/backend/src/environments/
├── environment.ts      # Base file (gets replaced at build time)
├── env.dev.ts         # Development environment
├── env.staging.ts     # Staging environment
├── env.test.ts        # Test environment
└── env.prod.ts        # Production environment
```

## Best Practices

1. **Never commit sensitive data** to environment files (use environment variables instead)
2. **Always use file replacement** to switch environments (don't use runtime detection)
3. **Test your builds** with different configurations before deploying
4. **Use environment variables** in production for sensitive configuration
5. **Keep environment files in sync** - all files should have the same structure

## Troubleshooting

### Environment not switching?
- Make sure you're building with the correct `--configuration` flag
- Clean the build output: `rm -rf dist/apps/backend`
- Rebuild: `npx nx build backend --configuration=staging`

### Port already in use?
- Kill existing processes: `lsof -ti:3001 | xargs kill -9`
- Or use a different port: `PORT=3002 npx nx serve backend`

### Wrong environment showing in API?
- Check that you're hitting the correct server (check the port)
- Verify the build configuration in the logs
- Look for `env.*.ts` in the webpack output to confirm file replacement

