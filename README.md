# ChatGPT Clone - Nx Monorepo

A modern ChatGPT-like interface built with React and NestJS in an Nx monorepo workspace.

## 🚀 Features

- **Dark Theme UI** - ChatGPT-inspired dark interface
- **Real-time Chat** - Interactive messaging with the AI assistant
- **Conversation History** - Sidebar with chat history management
- **Modern UI Components** - Material-UI and Radix UI components
- **Responsive Design** - Works on desktop and mobile
- **Voice Input Button** - Recording animation (UI ready)
- **File Attachment** - Attachment controls (UI ready)
- **Settings Panel** - Configuration options (UI ready)

## 🏗️ Architecture

```
chatbot-app/
├── apps/
│   ├── frontend/          # React + Vite + Material-UI
│   └── backend/           # NestJS API server
├── package.json           # Shared dependencies
└── nx.json               # Nx configuration
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Material-UI** for components
- **Radix UI** for advanced components
- **Emotion** for styling

### Backend
- **NestJS** framework
- **TypeScript**
- **CORS** enabled for frontend communication

### Development
- **Nx** monorepo tooling
- **ESLint** & **Prettier**
- **Jest** for testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend (port 3000):**
   ```bash
   npx nx serve backend
   ```

3. **Start the frontend (port 4200):**
   ```bash
npx nx serve frontend
```

4. **Open your browser:**
   ```
   http://localhost:4200
   ```

## 🎯 Usage

1. **New Chat** - Click "New chat" button in sidebar
2. **Send Messages** - Type in the input area and press Enter or click Send
3. **Voice Input** - Click the microphone icon (UI ready for implementation)
4. **Attach Files** - Click the attachment icon (UI ready for implementation)
5. **Settings** - Click the settings icon (UI ready for implementation)
6. **Chat History** - Previous conversations appear in the sidebar
7. **Delete Chats** - Hover over conversation and click delete icon

## 🔧 Development Commands

```bash
# Build applications
npx nx build frontend
npx nx build backend

# Run tests
npx nx test frontend
npx nx test backend

# Lint code
npx nx lint frontend
npx nx lint backend

# Generate new components
npx nx g @nx/react:component MyComponent --project=frontend
```

## 🎨 UI Features

- **ChatGPT-like Design** - Dark theme with green accent colors
- **Message Bubbles** - Different styling for user and assistant messages
- **Typing Indicators** - Loading animation when AI is responding
- **Smooth Scrolling** - Auto-scroll to latest messages
- **Responsive Layout** - Sidebar collapses on mobile
- **Hover Effects** - Interactive buttons and controls
- **Icon Animations** - Pulse animation for voice recording

## 🔌 API Endpoints

### POST `/api/chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "Hello!",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response:**
```
"Hello! I'm a ChatGPT Clone built with React and NestJS..."
```

## 🚀 Future Enhancements

- [ ] **Real AI Integration** - Connect to OpenAI API or local AI models
- [ ] **File Upload** - Support for document and image uploads
- [ ] **Voice Recognition** - Implement speech-to-text
- [ ] **Message Export** - Download conversations
- [ ] **User Authentication** - Login and user management
- [ ] **Conversation Search** - Search through chat history
- [ ] **Markdown Support** - Rich text formatting in messages
- [ ] **Code Highlighting** - Syntax highlighting for code blocks

## 📱 Screenshots

The interface features:
- Clean dark theme matching ChatGPT's design
- Sidebar with conversation management
- Modern input area with multiple controls
- Responsive message layout
- Professional loading states

---

Built with ❤️ using Nx, React, and NestJS
