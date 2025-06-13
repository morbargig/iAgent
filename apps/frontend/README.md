# Frontend - AI Chat Interface

A modern React-based chat interface built with Material-UI, featuring real-time streaming, mock mode, and a ChatGPT-inspired design.

## 🚀 Features

- **Real-time Streaming**: Token-by-token message streaming with visual indicators
- **Mock/API Toggle**: Switch between mock responses and live API
- **Dark/Light Theme**: Material-UI themes with smooth transitions
- **Responsive Design**: Mobile-first design with collapsible sidebar
- **Message Management**: Edit, regenerate, copy, share, and delete messages
- **Conversation History**: Persistent conversation storage with localStorage
- **Accessibility**: Full keyboard navigation and screen reader support

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v5** - Professional React components
- **Vite** - Lightning-fast build tool and dev server
- **React Hooks** - State management without external libraries

## 🏗️ Architecture

```
src/
├── app/
│   └── app.tsx              # Main application component
├── components/
│   ├── ChatArea.tsx         # Main chat interface with message display
│   ├── Sidebar.tsx          # Conversation management sidebar
│   └── InputArea.tsx        # Message input with send functionality
├── hooks/
│   └── useMockMode.ts       # Mock mode state management
├── assets/                  # Static assets and images
└── main.tsx                 # Application entry point
```

## 🎯 Key Components

### ChatArea Component
- **Message Display**: Renders user and assistant messages with proper styling
- **Action Buttons**: Edit, regenerate, copy, share, delete functionality
- **Streaming Indicators**: Shows when messages are being generated
- **Welcome Screen**: Onboarding interface for new users

### Sidebar Component
- **Conversation List**: All saved conversations with timestamps
- **New Chat**: Create new conversations
- **Search/Filter**: Quick access to conversation history
- **Responsive**: Collapses on mobile devices

### InputArea Component
- **Message Input**: Multi-line text input with auto-resize
- **Send Controls**: Send button with loading states
- **Stop Generation**: Ability to halt streaming responses
- **Edit Mode**: Special mode for editing existing messages

## 🎨 Theming

### Material-UI Theme System
```typescript
// Light Theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#fafafa' }
  }
});

// Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#121212' }
  }
});
```

### Theme Features
- **Automatic Persistence**: Theme preference saved to localStorage
- **Smooth Transitions**: CSS transitions for theme switching
- **Consistent Colors**: Material Design color palette
- **Responsive Typography**: Scales properly across devices

## 🔄 State Management

### Conversation State
```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}
```

### Message State
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: MessageMetadata;
}
```

### Local Storage Persistence
- **Conversations**: Full conversation history
- **Theme Preference**: Light/dark mode setting
- **Sidebar State**: Open/closed preference
- **Mock Mode**: API vs Mock preference

## 🚦 Development

### Start Development Server
```bash
npx nx serve frontend
# or
npm run dev:frontend
```

### Build for Production
```bash
npx nx build frontend
```

### Run Tests
```bash
npx nx test frontend
```

### Lint Code
```bash
npx nx lint frontend
```

## 🎮 Usage Guide

### Basic Chat Flow
1. **Type Message**: Enter text in the input area
2. **Send**: Press Enter or click Send button
3. **Watch Stream**: See response generate token by token
4. **Interact**: Use action buttons for message management

### Mock Mode
- **Toggle**: Click "Mock"/"API" chip in header
- **Benefits**: 
  - No backend required
  - Consistent responses for testing
  - Realistic streaming simulation
  - Various response types based on input

### Message Actions
- **Edit** (✏️): Modify user messages and regenerate
- **Regenerate** (🔄): Get new response for any message
- **Copy** (📋): Copy message content to clipboard
- **Share** (📤): Share message content
- **Delete** (🗑️): Remove message from conversation

### Conversation Management
- **Create**: Click "New Chat" in sidebar
- **Switch**: Click any conversation to open
- **Delete**: Hover and click delete icon
- **Auto-save**: Everything saves automatically

## 📱 Mobile Experience

### Responsive Design
- **Sidebar**: Collapsible on mobile (< 768px)
- **Messages**: Optimized spacing and font sizes
- **Input**: Touch-friendly with proper keyboard handling
- **Actions**: Easily accessible on touch devices

### iOS Specific
- **Safe Areas**: Proper handling of notched devices
- **Viewport**: Correct height calculations
- **Scroll**: Smooth scrolling and proper momentum

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_VERSION=1.0.0
```

### Build Configuration
```javascript
// vite.config.ts
export default defineConfig({
  base: './', // For GitHub Pages deployment
  build: {
    outDir: '../../dist/apps/frontend',
    emptyOutDir: true
  }
});
```

## 🧪 Testing

### Unit Tests
- **Components**: React Testing Library tests
- **Hooks**: Custom hook testing with renderHook
- **Utils**: Utility function testing

### Integration Tests
- **User Flows**: Complete chat interactions
- **State Management**: Conversation and message handling
- **API Integration**: Mock and real API testing

### Example Test
```typescript
import { render, screen } from '@testing-library/react';
import { ChatArea } from './ChatArea';

test('displays welcome screen when no messages', () => {
  render(<ChatArea messages={[]} isLoading={false} />);
  expect(screen.getByText(/Welcome to AI Chat/)).toBeInTheDocument();
});
```

## 🚀 Deployment

### Static Hosting (GitHub Pages, Netlify, Vercel)
```bash
# Build for production
npx nx build frontend

# Deploy dist/apps/frontend folder
```

### GitHub Pages Specific
```bash
# Set base path for GitHub Pages
# Update vite.config.ts: base: '/repository-name/'
```

### Docker
```dockerfile
FROM nginx:alpine
COPY dist/apps/frontend /usr/share/nginx/html
EXPOSE 80
```

## 🐛 Debugging

### Common Issues

**Build Errors:**
```bash
# Clear cache and rebuild
npx nx reset
npx nx build frontend
```

**Development Server Issues:**
```bash
# Check port availability
npx kill-port 4200
npx nx serve frontend
```

**TypeScript Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Debug Tools
- **React Developer Tools**: Browser extension for React debugging
- **Vite DevTools**: Built-in development server debugging
- **Network Tab**: Monitor API calls and streaming

## 🔍 Performance

### Optimization Features
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient message list rendering
- **Throttled Updates**: Streaming UI updates optimized

### Bundle Analysis
```bash
# Analyze bundle size
npx nx build frontend --analyze
```

## 🤝 Contributing

### Component Guidelines
1. **TypeScript**: Use strict typing for all props and state
2. **Material-UI**: Follow MUI design patterns and components
3. **Accessibility**: Include proper ARIA labels and keyboard support
4. **Testing**: Write tests for all new components
5. **Documentation**: Add JSDoc comments for complex functions

### Code Style
- **ESLint**: Follow configured linting rules
- **Prettier**: Auto-format code on save
- **Naming**: Use descriptive names for components and functions
- **Props**: Interface definitions for all component props

## 📚 Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [NX React Documentation](https://nx.dev/recipes/react)

---

**Part of the iAgent monorepo - Built with React + Material-UI** 