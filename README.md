# iAgent - AI Chat Application

A modern ChatGPT-style AI chat interface built with React, NestJS, and Material-UI. Features real-time streaming, multi-language support (English, Hebrew, Arabic), and comprehensive conversation management.

## ✨ Features

- **🔄 Real-time Streaming** - Token-by-token AI responses with smooth animations
- **🌍 Multi-language Support** - English, Hebrew, Arabic with RTL/LTR support
- **🎨 Dark/Light Themes** - Beautiful Material-UI themes with localStorage persistence
- **💬 Conversation Management** - Create, edit, delete, and organize chats
- **📱 Mobile Responsive** - Touch-friendly interface with collapsible sidebar
- **🔧 Mock/API Toggle** - Switch between mock responses and live API
- **⚡ Modern Stack** - React 19, TypeScript, NX monorepo

## 🏗️ Architecture

```
iagent2/
├── apps/
│   ├── frontend/          # React + Material-UI chat interface
│   └── backend/           # NestJS API with streaming endpoints
└── libs/
    └── stream-mocks/      # Shared streaming utilities
```

## 🛠️ Tech Stack

- **Frontend**: React 19, Material-UI, TypeScript, Vite
- **Backend**: NestJS, Express, Server-Sent Events
- **Tools**: NX monorepo, ESLint, Jest
- **Features**: i18n, RTL support, localStorage persistence

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend    # http://localhost:4200/iAgent/
npm run dev:backend     # http://localhost:3000/api
```

## 🎮 Usage

1. **Chat**: Type messages and watch AI responses stream in real-time
2. **Languages**: Switch between English (🇺🇸), Hebrew (🇮🇱), Arabic (🇸🇦)
3. **Themes**: Toggle dark/light mode (persisted across sessions)
4. **Modes**: Switch between Mock and API mode in the header
5. **Conversations**: Create new chats, edit messages, regenerate responses

## 🔧 Development

```bash
# Development
npm run dev                 # Start both apps
npm run dev:frontend        # Frontend only
npm run dev:backend         # Backend only

# Building
npm run build              # Build all projects
npm run build:frontend     # Frontend only
npm run build:backend      # Backend only

# Testing & Linting
npm test                   # Run all tests
npm run lint              # Lint all projects
```

## 📱 Mobile Support

- Responsive sidebar that collapses on mobile
- Touch-optimized interface elements
- RTL/LTR language support
- iOS safe area handling

## 🌐 API Endpoints

- `GET /api` - Health check
- `POST /api/chat` - Standard chat endpoint
- `POST /api/chat/stream` - Streaming chat with Server-Sent Events
- `GET /api/chat/sse-stream` - SSE streaming endpoint

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using NX, React, and NestJS**
