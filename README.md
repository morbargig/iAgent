# iAgent2 - AI Chat Application

A modern ChatGPT-like AI chat application built with NX monorepo, React frontend, NestJS backend, and comprehensive mock streaming capabilities.

## 🚀 Features

- **Real-time Streaming**: Token-by-token response streaming for natural conversation flow
- **Mock Mode**: Comprehensive mock responses for development and testing
- **Dark/Light Theme**: Beautiful Material-UI themes with smooth transitions
- **Conversation Management**: Create, edit, delete, and organize chat conversations
- **Message Actions**: Edit, regenerate, copy, share, and delete messages
- **Responsive Design**: Mobile-friendly interface with sidebar toggle
- **Persistent Storage**: LocalStorage persistence for conversations and preferences
- **Type Safety**: Full TypeScript implementation across all components

## 🏗️ Architecture

```
iagent2/
├── apps/
│   ├── frontend/          # React + Material-UI chat interface
│   └── backend/           # NestJS API server with streaming
├── libs/
│   └── stream-mocks/      # Shared streaming mock utilities
├── tools/
└── docs/
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Professional UI components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### Backend
- **NestJS** - Enterprise Node.js framework
- **Express** - HTTP server
- **TypeScript** - Type-safe API development
- **Server-Sent Events** - Real-time streaming

### Shared Libraries
- **Stream Mocks** - Intelligent mock responses with realistic streaming
- **TypeScript** - Shared types and utilities

### DevOps & Tooling
- **NX** - Monorepo management and build system
- **ESLint** - Code linting and formatting
- **Jest** - Unit testing framework

## 🚦 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iagent2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually
   npx nx serve frontend    # Frontend on http://localhost:4200
   npx nx serve backend     # Backend on http://localhost:3000
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## 🎮 Usage

### Basic Chat
1. Type your message in the input area
2. Press Enter or click Send
3. Watch the AI response stream in real-time

### Mock vs API Mode
- **Toggle**: Click the "Mock"/"API" chip in the header
- **Mock Mode**: Uses intelligent local responses (default)
- **API Mode**: Connects to the backend streaming service

### Message Management
- **Edit**: Click edit icon to modify and regenerate from any message
- **Regenerate**: Click refresh icon to get a new response
- **Copy**: Click copy icon to copy message content
- **Delete**: Click delete icon to remove messages
- **Share**: Click share icon for sharing options

### Conversation Management
- **New Chat**: Click "New Chat" in sidebar
- **Switch**: Click any conversation in sidebar to switch
- **Delete**: Hover over conversation and click delete icon

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                 # Start both frontend and backend
npx nx serve frontend       # Frontend only
npx nx serve backend        # Backend only

# Building
npx nx build frontend       # Build frontend for production
npx nx build backend        # Build backend for production
npm run build              # Build all projects

# Testing
npx nx test frontend        # Run frontend tests
npx nx test backend         # Run backend tests
npx nx test stream-mocks    # Run shared library tests

# Linting
npx nx lint frontend        # Lint frontend
npx nx lint backend         # Lint backend
npm run lint               # Lint all projects
```

### Project Structure

```
apps/frontend/src/
├── components/            # React components
│   ├── ChatArea.tsx      # Main chat interface
│   ├── Sidebar.tsx       # Conversation sidebar
│   └── InputArea.tsx     # Message input
├── hooks/                # Custom React hooks
│   └── useMockMode.ts    # Mock mode state management
└── app/                  # Main app component

apps/backend/src/
├── app/                  # NestJS modules
├── chat/                 # Chat-related endpoints
│   └── chat.controller.ts # Streaming chat API
└── main.ts              # Application entry point

libs/stream-mocks/src/
├── lib/
│   └── stream-mocks.ts   # Mock streaming utilities
└── index.ts             # Library exports
```

### Adding New Features

1. **Frontend Components**: Add to `apps/frontend/src/components/`
2. **Backend Endpoints**: Add to `apps/backend/src/`
3. **Shared Utilities**: Add to `libs/stream-mocks/src/`

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code standards
- **Prettier**: Automatic code formatting
- **Material-UI**: Follow MUI design patterns

## 🌐 API Endpoints

### Chat Streaming
```
POST /api/chat/stream
Content-Type: application/json

{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}

Response: Server-Sent Events stream
```

## 🎨 Theming

The application supports both light and dark themes with:
- **Automatic persistence** to localStorage
- **Smooth transitions** between themes
- **Material-UI color palettes**
- **Responsive design** across all screen sizes

## 📱 Mobile Support

- **Responsive sidebar** - Collapses on mobile
- **Touch-friendly** interface elements
- **iOS safe areas** for proper display
- **Mobile-optimized** chat bubbles and inputs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific project
npx nx test frontend
npx nx test backend
npx nx test stream-mocks

# Run tests in watch mode
npx nx test frontend --watch
```

## 🚀 Deployment

### Frontend (Static)
```bash
# Build for production
npx nx build frontend

# Deploy dist/apps/frontend to your static hosting
```

### Backend (Node.js)
```bash
# Build for production
npx nx build backend

# Run production server
node dist/apps/backend/main.js
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the beautiful component library
- **NestJS** for the robust backend framework
- **NX** for excellent monorepo tooling
- **React** team for the amazing frontend library

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using NX, React, and NestJS**
