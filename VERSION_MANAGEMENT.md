# Version Management Guide

This project uses `standard-version` for automated version management and changelog generation.

## Overview

- **Version File**: `version.json` - Single source of truth for application version
- **Version Tracking**: Both frontend and backend read from `version.json` or environment variables
- **API Endpoint**: `/api/version` - Returns current application version
- **Health Check**: `/api` - Includes version in response

## Version Format

The project follows [Semantic Versioning](https://semver.org/) (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Current version: `1.0.0`

## Usage

### Automatic Version Bumping

Standard-version automatically:
1. Bumps version in `version.json`, `package.json`, and app-specific `package.json` files
2. Generates/updates `CHANGELOG.md` based on commit messages
3. Creates a git tag for the release
4. Commits changes

### Release Commands

```bash
# Patch release (1.0.0 -> 1.0.1)
npm run release:patch

# Minor release (1.0.0 -> 1.1.0)
npm run release:minor

# Major release (1.0.0 -> 2.0.0)
npm run release:major

# Automatic release (detects from commit messages)
npm run release

# Pre-release versions
npm run release:alpha  # 1.0.0 -> 1.0.1-alpha.0
npm run release:beta   # 1.0.0 -> 1.0.1-beta.0
```

### Commit Message Format

Standard-version uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add version tracking endpoint"
git commit -m "fix: resolve version reading issue"
git commit -m "docs: update version management guide"
```

### Manual Version Override

You can manually set version via environment variable:

**Backend:**
```bash
APP_VERSION=1.2.3 npm run dev:backend
```

**Frontend:**
```bash
VITE_APP_VERSION=1.2.3 npm run dev:frontend
```

## Version Access

### Backend

```typescript
import { environment } from './environments/environment';
const version = environment.app.version;
```

**API Endpoints:**
- `GET /api/version` - Returns version information
- `GET /api` - Health check includes version

### Frontend

```typescript
import { environment } from './environments/environment';
const version = environment.app.version;
```

The version is automatically injected at build time from `version.json`.

## Workflow

1. **Make changes** and commit with conventional commit messages
2. **Run release command**:
   ```bash
   npm run release:patch  # or minor/major
   ```
3. **Review changes**:
   - `version.json` updated
   - `CHANGELOG.md` updated
   - Git tag created
   - Changes committed
4. **Push to repository**:
   ```bash
   git push --follow-tags origin main
   ```

## Configuration

Version management is configured in `.versionrc.json`:
- Bumps version in multiple `package.json` files
- Updates `version.json`
- Generates changelog sections
- Creates git tags

## Troubleshooting

### Version not updating

1. Check `version.json` exists and is valid JSON
2. Verify environment variables are set correctly
3. Ensure `standard-version` is installed: `npm install --save-dev standard-version`

### Build issues

1. Clear build cache: `npm run clean`
2. Rebuild: `npm run build`
3. Check Vite config reads version correctly

### API version mismatch

1. Ensure backend reads from `version.json` or `APP_VERSION` env var
2. Check frontend reads from `VITE_APP_VERSION` or build-time injection
3. Verify both use same version source

