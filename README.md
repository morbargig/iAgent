# 🤖 iAgent - AI Chat Application

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

# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:4200
npm run dev:backend   # http://localhost:3000
```

### Available Scripts

```bash
# Development
npm run dev              # Start both apps
npm run dev:frontend     # Start React app only
npm run dev:backend      # Start NestJS API only

# Building
npm run build            # Build both apps
npm run build:frontend   # Build React app
npm run build:backend    # Build NestJS API

# Testing
npm run test             # Test both apps
npm run test:frontend    # Test React app
npm run test:backend     # Test NestJS API

# Linting
npm run lint             # Lint both apps
npm run lint:frontend    # Lint React app
npm run lint:backend     # Lint NestJS API

# Utilities
npm run clean            # Clean workspace
npm run graph            # View dependency graph
npm run upgrade          # Upgrade all packages
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

Create `.env` files in the respective app directories:

**Frontend** (`apps/frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_MOCK_MODE=false
```

**Backend** (`apps/backend/.env`):
```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

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
