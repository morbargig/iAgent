# 🤖 iAgent - AI Chat Application

[![Made with Nx](https://img.shields.io/badge/Made%20with-Nx-blue)](https://nx.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?logo=material-ui&logoColor=white)](https://mui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)

A modern, full-stack AI chat application built with React, NestJS, and TypeScript in an Nx monorepo. Features real-time streaming, multi-language support, and a beautiful Material-UI interface.

## ✨ Features

- 🔄 **Real-time Streaming** - Live AI response streaming with Server-Sent Events
- 🌍 **Multi-language Support** - English, Hebrew, Arabic with RTL/LTR support
- 🎨 **Modern UI** - Beautiful Material-UI components with dark/light themes
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- 🛡️ **Type Safe** - Full TypeScript implementation
- 📚 **API Documentation** - Comprehensive Swagger/OpenAPI docs
- 🎯 **Mock Mode** - Built-in mock responses for development
- 💾 **Persistent Storage** - Conversation history and preferences

## 🏗️ Architecture

```
iAgent/
├── apps/
│   ├── frontend/          # React application with Material-UI
│   └── backend/           # NestJS API server
├── libs/                  # Shared libraries (future)
├── docs/                  # Documentation
└── scripts/               # Build and deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/iAgent.git
cd iAgent

# Install dependencies
npm install

# Start the frontend (React app with Vite)
npx nx serve @iagent/frontend
# The app will be available at: http://localhost:4200/iAgent/

# Start the backend (NestJS API)
npx nx serve @iagent/backend
# The API will be available at: http://localhost:3000

# Or use npm scripts if available
npm run dev:frontend  # Alternative command
npm run dev:backend   # Alternative command
```

### Available Scripts

```bash
# Development (using Nx)
npx nx serve @iagent/frontend   # Start React app at http://localhost:4200/iAgent/
npx nx serve @iagent/backend    # Start NestJS API at http://localhost:3000

# Building (using Nx)
npx nx build @iagent/frontend   # Build React app
npx nx build @iagent/backend    # Build NestJS API
npx nx run-many -t build        # Build all projects

# Testing (using Nx)
npx nx test @iagent/frontend    # Test React app
npx nx test @iagent/backend     # Test NestJS API
npx nx run-many -t test         # Test all projects

# Linting (using Nx)
npx nx lint @iagent/frontend    # Lint React app
npx nx lint @iagent/backend     # Lint NestJS API
npx nx run-many -t lint         # Lint all projects

# Utilities
npx nx graph                    # View dependency graph
npx nx reset                    # Reset Nx cache
npx nx affected:build           # Build affected projects
npx nx affected:test            # Test affected projects

# Legacy npm scripts (if configured)
npm run dev:frontend     # Alternative to npx nx serve @iagent/frontend
npm run dev:backend      # Alternative to npx nx serve @iagent/backend
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v7** - Modern Material Design components
- **Vite** - Fast build tool and dev server
- **React Markdown** - Markdown rendering with syntax highlighting

### Backend
- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe server development
- **Express** - Fast, unopinionated web framework
- **Swagger/OpenAPI** - API documentation and testing
- **Server-Sent Events** - Real-time streaming

### Development Tools
- **Nx** - Monorepo management and build system
- **ESLint** - Code linting and formatting
- **Jest** - Testing framework
- **Prettier** - Code formatting

## 📱 Applications

### [Frontend](./apps/frontend/README.md)
React-based chat interface with Material-UI components, real-time streaming, and multi-language support.

**Key Features:**
- Real-time message streaming
- Dark/light theme switching
- Mobile-responsive design
- Conversation management
- Message actions (copy, edit, regenerate)

### [Backend](./apps/backend/README.md)
NestJS API server providing chat functionality with comprehensive documentation and streaming support.

**Key Features:**
- RESTful API with Swagger docs
- Server-Sent Events streaming
- Request validation and error handling
- Mock responses for development
- CORS and security configuration

## 🌐 API Documentation

When running the backend, comprehensive API documentation is available at:
- **Swagger UI**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api

## 🔧 Configuration

### Environment Variables

⚠️ **Important**: Sensitive data (MongoDB connection strings, JWT secrets, passwords) are no longer hardcoded. You **MUST** configure environment variables before running the application.

#### Backend Environment Setup

1. **Copy the example environment file**:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

2. **Fill in your actual values** in `apps/backend/.env`:
   ```bash
   # Required variables (see .env.example for full list)
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_jwt_secret_key_here
   DB_USERNAME=your_database_username
   DB_PASSWORD=your_database_password
   ```

3. **Generate a secure JWT secret** (recommended):
   ```bash
   openssl rand -base64 32
   ```

📋 **See** [`apps/backend/.env.example`](./apps/backend/.env.example) for a complete list of all environment variables.

#### Frontend Environment Setup

Create `apps/frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_MOCK_MODE=false
```

#### GitHub Actions Secrets

For CI/CD workflows, configure secrets in GitHub:
- Repository Settings → Secrets and variables → Actions

📋 **See** [`.github/SECRETS.md`](./.github/SECRETS.md) for a complete guide on configuring GitHub Actions secrets.

## 🚀 Deployment

### Production Build
```bash
# Build both applications
npm run build

# Files will be in:
# - dist/apps/frontend/  (Static files for hosting)
# - dist/apps/backend/   (Node.js server files)
```

### Docker Support
```bash
# Build Docker images (when Dockerfiles are added)
docker build -t iAgent-frontend ./apps/frontend
docker build -t iAgent-backend ./apps/backend
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run e2e tests
npm run e2e
```

## 📊 Nx Workspace

This project uses Nx for monorepo management:

```bash
# View project graph
npm run graph

# Run affected tests only
npx nx affected:test

# Build affected projects only
npx nx affected:build

# Generate new library
npx nx g @nx/react:lib my-lib

# Generate new application
npx nx g @nx/react:app my-app
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Add tests** for new functionality
5. **Run tests**: `npm run test`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all linting passes

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Frontend Documentation](./apps/frontend/README.md)
- [Backend Documentation](./apps/backend/README.md)
- [API Documentation](http://localhost:3000/api/docs) (when running)
- [Nx Documentation](https://nx.dev)

---

**Built with ❤️ using React, NestJS, and Nx**
