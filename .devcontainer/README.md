# iAgent Development Container

This devcontainer provides a complete development environment for the iAgent Nx monorepo.

## Quick Start

1. **Open in Dev Container**:

   - VS Code: `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
   - GitHub Codespaces: Click "Code" → "Codespaces" → "Create codespace on main"

2. **Wait for Setup**: The container will automatically run `npm install`

3. **Start Development Servers**:

   ```bash
   # Start frontend dev server (port 4200)
   npm run dev

   # Or start backend API server (port 3000)
   nx serve backend

   # Or start both simultaneously
   nx run-many -t serve
   ```

## Available Ports

| Port | Service     | URL                            | Description            |
| ---- | ----------- | ------------------------------ | ---------------------- |
| 3000 | Backend API | http://localhost:3001/api      | NestJS API server      |
| 3000 | API Docs    | http://localhost:3001/api/docs | Swagger documentation  |
| 4200 | Frontend    | http://localhost:4200          | React dev server (HMR) |
| 4300 | Preview     | http://localhost:4300          | Vite preview server    |

## Useful Nx Commands

```bash
# Development
nx serve frontend          # Start frontend dev server
nx serve backend          # Start backend API server
nx run-many -t serve      # Start all apps

# Building
nx build frontend         # Build frontend for production
nx build backend          # Build backend for production
nx run-many -t build      # Build all projects

# Testing
nx test frontend          # Run frontend tests
nx test backend           # Run backend tests
nx run-many -t test       # Run all tests

# Linting
nx lint frontend          # Lint frontend code
nx lint backend           # Lint backend code
nx run-many -t lint       # Lint all projects

# Docker
nx docker-build frontend  # Build frontend Docker image
```

## VS Code Features

- **Nx Console**: Integrated Nx commands and generators
- **Auto-formatting**: Prettier runs on save
- **ESLint**: Automatic error detection and fixing
- **TypeScript**: Enhanced IntelliSense and error checking
- **Testing**: Integrated test explorer and debugging

## Troubleshooting

### Port Conflicts

If ports are already in use, VS Code will automatically forward to available ports.

### Package Installation Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset
```

## Docker in Docker

The container includes Docker support for building and running containerized applications:

```bash
# Build frontend Docker image
nx docker-build frontend

# Run the built image
docker run -p 3000:3000 iagent-frontend
```
