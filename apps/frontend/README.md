# 🎨 iAgent Frontend

A modern, responsive React application built with Material-UI and TypeScript, providing an intuitive chat interface for AI interactions.

## ✨ Features

- 🔄 **Real-time Streaming**: Live AI response streaming with Server-Sent Events
- 🌍 **Multi-language Support**: English, Hebrew, Arabic with RTL/LTR support
- 🎨 **Material Design**: Beautiful UI with Material-UI components
- 🌙 **Dark/Light Theme**: Persistent theme switching
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- 💾 **Local Storage**: Conversation history and preferences persistence
- 🔄 **Message Actions**: Copy, edit, regenerate, like/dislike messages
- 🎯 **Mock/API Toggle**: Switch between mock and real API responses

## 🛠️ Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v7** - Modern Material Design components
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API communication
- **React Markdown** - Markdown rendering with syntax highlighting
- **i18next** - Internationalization framework

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📁 Project Structure

```
src/
├── app/                    # Main application component
├── components/            # Reusable UI components
│   ├── ChatArea.tsx      # Main chat interface
│   ├── InputArea.tsx     # Message input component
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── ...
├── hooks/                # Custom React hooks
├── services/             # API services and utilities
├── types/                # TypeScript type definitions
└── assets/               # Static assets
```

## 🎯 Key Components

### ChatArea
- Message display and management
- Real-time streaming visualization
- Message actions (copy, edit, regenerate)
- Theme and language controls

### InputArea
- Message composition
- File upload support
- Send/stop controls
- Responsive positioning

### Sidebar
- Conversation history
- New chat creation
- Conversation management
- Collapsible design

## 🌐 Internationalization

The app supports multiple languages with automatic RTL/LTR layout switching:

- **English** (en) - Default
- **Hebrew** (he) - RTL layout
- **Arabic** (ar) - RTL layout

## 🎨 Theming

Built-in dark/light theme support with:
- Material-UI theme provider
- Persistent theme preferences
- Smooth transitions
- Consistent color schemes

## 📱 Responsive Design

- Mobile-first approach
- Adaptive sidebar behavior
- Touch-friendly interactions
- Optimized for all screen sizes

## 🔧 Configuration

Environment variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_MOCK_MODE` - Enable/disable mock mode

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 