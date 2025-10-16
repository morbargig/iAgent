# iAgent - Project Overview & Architecture

**Version:** 1.0.0  
**Last Updated:** October 15, 2025

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Frontend Structure](#frontend-structure)
5. [Backend Structure](#backend-structure)
6. [API Reference](#api-reference)
7. [Shared Libraries](#shared-libraries)
8. [Data Flow](#data-flow)
9. [Key Technical Topics](#key-technical-topics)
10. [Configuration](#configuration)
11. [Development Guide](#development-guide)

---

## Project Overview

**iAgent** is a modern, full-stack AI chat application built with React, NestJS, and TypeScript in an Nx monorepo architecture. It provides real-time streaming chat capabilities with multi-language support and a beautiful Material-UI interface.

### Technology Stack

#### Frontend

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v7** - Modern Material Design components
- **Vite** - Fast build tool and dev server
- **React Markdown** - Markdown rendering with syntax highlighting

#### Backend

- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe server development
- **MongoDB + Mongoose** - Database (optional, supports demo mode)
- **Swagger/OpenAPI** - API documentation
- **JWT** - Authentication
- **Server-Sent Events (SSE)** - Real-time streaming

#### Development Tools

- **Nx** - Monorepo management and build system
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Prettier** - Code formatting

### Key Features

- ✅ **Real-time Streaming** - Live AI response streaming with SSE
- ✅ **Multi-language Support** - English, Hebrew, Arabic with RTL/LTR
- ✅ **JWT Authentication** - Secure user authentication
- ✅ **Mock Mode** - Built-in mock responses for development
- ✅ **Persistent Storage** - Conversation history and preferences
- ✅ **Filter Management** - Advanced search filters with snapshots
- ✅ **Report Integration** - Report viewing and analysis
- ✅ **Dark/Light Themes** - Beautiful Material-UI themes
- ✅ **Mobile Responsive** - Optimized for all screen sizes
- ✅ **Demo Mode** - Works without MongoDB (in-memory storage)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     iAgent Application                       │
│                    (Nx Monorepo v21.4.1)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │   Apps Layer   │         │   Libs Layer   │
        └───────┬────────┘         └───────┬────────┘
                │                           │
    ┌───────────┴───────────┐      ┌────────┴─────────┐
    │                       │      │                  │
┌───▼────┐          ┌──────▼───┐  │  Shared Libraries │
│Frontend│          │ Backend  │  │                  │
│ React  │◄────────►│  NestJS  │  │ ├─ shared-types  │
│  App   │   HTTP   │   API    │  │ ├─ stream-mocks  │
└────────┘   SSE    └──────┬───┘  │ ├─ shared-utils  │
                           │      │ └─ types         │
                    ┌──────▼───┐  └──────────────────┘
                    │ MongoDB  │
                    │(Optional)│
                    └──────────┘
```

### Application Flow

```
User Browser
    │
    ├─► Login (JWT Token)
    │
    ├─► Send Message
    │   │
    │   └─► POST /api/chat/stream
    │       │
    │       ├─► StreamingClient (Frontend)
    │       │
    │       └─► ChatController (Backend)
    │           │
    │           ├─► ChatService (Business Logic)
    │           │   │
    │           │   └─► MongoDB / Demo Storage
    │           │
    │           └─► SSE Stream Response
    │               │
    │               └─► Real-time Tokens to UI
    │
    └─► Filter Management
        │
        └─► Save/Load Filter Snapshots
```

---

## Folder Structure

### Root Level

```
iAgent/
├── apps/                    # Application projects
│   ├── frontend/           # React application
│   └── backend/            # NestJS API server
│
├── libs/                   # Shared libraries
│   ├── shared-types/      # Common TypeScript types
│   ├── stream-mocks/      # Streaming utilities
│   ├── shared-utils/      # Utility functions
│   └── types/             # Additional type definitions
│
├── docs/                   # Documentation
│   ├── architecture.drawio
│   ├── CI-CD.md
│   ├── CI-GUIDE.md
│   ├── CD-GUIDE.md
│   ├── DEPLOYMENT.md
│   └── LAYOUT_STRUCTURE.md
│
├── scripts/               # Build and deployment scripts
│   └── deploy-gh-pages.sh
│
├── dist/                  # Build output
│
├── node_modules/          # Dependencies
│
├── nx.json               # Nx workspace configuration
├── tsconfig.base.json    # TypeScript base config
├── package.json          # Dependencies and scripts
├── README.md             # Project README
├── STYLE_GUIDE.md        # Coding style guide
├── DESIGN_SYSTEM.md      # Design system documentation
└── overall.md            # This file
```

---

## Frontend Structure

### Directory Layout

```
apps/frontend/
├── src/
│   ├── app/                      # Main application
│   │   ├── app.tsx              # Root component with theme & routing
│   │   ├── app.module.css       # CSS modules
│   │   └── app.spec.tsx         # Tests
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── ChatArea.tsx         # Message display area
│   │   ├── InputArea.tsx        # Message input with controls
│   │   ├── LoginForm.tsx        # Authentication form
│   │   ├── HeaderControls.tsx   # App header with settings
│   │   ├── MarkdownRenderer.tsx # Message rendering
│   │   ├── ReportDetailsPanel.tsx # Report viewer
│   │   ├── FilterPreview.tsx    # Filter configuration display
│   │   ├── FilterDetailsDialog.tsx # Filter details modal
│   │   ├── FilterNameDialog.tsx  # Filter naming dialog
│   │   ├── ToolSettingsDialog.tsx # Tool configuration
│   │   ├── AdvancedSearchInterface.tsx # Search UI
│   │   ├── BasicDateRangePicker.tsx # Date selection
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   ├── Translate.tsx        # Translation component
│   │   └── withTranslation.tsx  # HOC for translations
│   │
│   ├── contexts/                 # React Context providers
│   │   └── TranslationContext.tsx # i18n context
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useLocalStorage.ts   # localStorage hook
│   │   ├── useMockMode.ts       # Mock mode toggle
│   │   ├── useToolToggles.ts    # Tool settings management
│   │   └── useAnimatedPlaceholder.ts # Placeholder animations
│   │
│   ├── i18n/                     # Internationalization
│   │   ├── translations/
│   │   │   ├── en.ts            # English translations
│   │   │   ├── ar.ts            # Arabic translations
│   │   │   └── he.ts            # Hebrew translations
│   │   └── types.ts             # i18n type definitions
│   │
│   ├── services/                 # Service layer
│   │   └── toolService.ts       # Tool management service
│   │
│   ├── utils/                    # Utility functions
│   │   ├── id-generator.ts      # Unique ID generation
│   │   ├── reportLinks.ts       # Report link parsing
│   │   └── textUtils.ts         # Text manipulation
│   │
│   ├── main.tsx                  # Application entry point
│   └── styles.css                # Global styles
│
├── public/                       # Static assets
│   └── favicon.ico
│
├── index.html                    # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── tailwind.config.cjs          # Tailwind CSS config
├── postcss.config.cjs           # PostCSS config
├── project.json                 # Nx project config
└── package.json                 # Frontend dependencies
```

### Key Frontend Components

#### 1. **app.tsx** - Main Application Component

- Root component with Material-UI theme provider
- Manages application state (conversations, auth, theme)
- Implements iAgent design system with custom tokens
- Handles message streaming and user interactions

#### 2. **Sidebar.tsx** - Navigation Sidebar

- Conversation list with search
- New conversation creation
- Conversation renaming/deletion
- Theme toggle
- Resizable width
- Streaming status indicators

#### 3. **ChatArea.tsx** - Message Display

- Message rendering with Markdown support
- Message actions (copy, edit, regenerate, delete)
- Filter information display
- Report link integration
- Scrolling management

#### 4. **InputArea.tsx** - Message Input

- Multi-line text input with auto-resize
- Filter management UI
- Tool selection
- Date range picker
- Country selector
- Send/Stop buttons

#### 5. **LoginForm.tsx** - Authentication

- Email/password login
- JWT token management
- Demo credentials display

#### 6. **TranslationContext.tsx** - i18n Management

- Language switching (en, ar, he)
- RTL/LTR direction handling
- Translation loading
- localStorage persistence

### Frontend Data Flow

```
User Input
    ↓
InputArea Component
    ↓
handleSendMessage()
    ↓
StreamingClient.streamChat()
    ├─► Mock Mode → generateMockResponse()
    └─► API Mode → fetch('/api/chat/stream')
         ↓
    SSE Stream Chunks
         ↓
    onToken() Callback
         ↓
    Update Message State
         ↓
    ChatArea Re-renders
         ↓
    Display Streamed Content
```

---

## Backend Structure

### Directory Layout

```
apps/backend/
├── src/
│   ├── app/
│   │   ├── controllers/          # API Controllers
│   │   │   └── chat.controller.ts # Chat endpoints
│   │   │
│   │   ├── services/             # Business Logic
│   │   │   └── chat.service.ts   # Chat service
│   │   │
│   │   ├── schemas/              # MongoDB Schemas
│   │   │   └── chat.schema.ts    # Chat, Message, Filter schemas
│   │   │
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   └── chat.dto.ts       # Request/Response DTOs
│   │   │
│   │   ├── auth/                 # Authentication
│   │   │   ├── auth.service.ts   # Auth logic
│   │   │   ├── auth.guard.ts     # Auth guard
│   │   │   ├── jwt.strategy.ts   # JWT strategy
│   │   │   └── jwt-auth.guard.ts # JWT guard
│   │   │
│   │   ├── decorators/           # Custom Decorators
│   │   │   ├── public.decorator.ts   # @Public
│   │   │   ├── user.decorator.ts     # @UserId
│   │   │   └── auth.decorator.ts     # @Auth
│   │   │
│   │   ├── app.module.ts         # Main module
│   │   ├── app.controller.ts     # App controller
│   │   └── app.service.ts        # App service
│   │
│   ├── assets/                   # Static assets
│   └── main.ts                   # Application entry point
│
├── webpack.config.js             # Webpack configuration
├── tsconfig.json                # TypeScript config
├── jest.config.js               # Jest configuration
├── jest.setup.ts                # Jest setup
├── project.json                 # Nx project config
└── package.json                 # Backend dependencies
```

### Key Backend Components

#### 1. **chat.controller.ts** - REST API Controller

Exposes all chat-related endpoints with Swagger documentation:

- Chat CRUD operations
- Message management
- Filter management
- Status and statistics endpoints

#### 2. **chat.service.ts** - Business Logic Layer

Implements core chat functionality:

- Dual-mode operation (MongoDB / Demo mode)
- In-memory storage for demo mode
- Chat creation and management
- Message storage with filter snapshots
- Filter configuration management

#### 3. **chat.schema.ts** - MongoDB Schemas

Defines three main schemas:

- **Chat Schema**: Conversation metadata
- **ChatMessage Schema**: Individual messages with filter snapshots
- **ChatFilter Schema**: Filter configurations

#### 4. **auth.service.ts** - Authentication Service

Handles user authentication:

- JWT token generation and validation
- Mock user database for demo
- Simple JWT implementation (production should use proper library)

#### 5. **chat.dto.ts** - Data Transfer Objects

Type-safe request/response validation:

- ChatRequestDto, ChatResponseDto
- ChatMessageDto with filter support
- ToolSelectionDto
- StreamTokenDto

### Backend Data Flow

```
HTTP Request
    ↓
ChatController (@Controller('/chats'))
    ↓
JwtAuthGuard (JWT Validation)
    ↓
@UserId Decorator (Extract User ID)
    ↓
ChatService Methods
    ├─► isDemoMode = true
    │   └─► In-Memory Storage (Map)
    │
    └─► isDemoMode = false
        └─► MongoDB (Mongoose)
             ↓
Response / SSE Stream
```

---

## API Reference

### Base URL

```
Development: http://localhost:3001
Production: [Your production URL]
```

### Authentication

#### POST /api/auth/login

Login and receive JWT token

**Request:**

```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user_123456789",
  "email": "demo@example.com",
  "role": "user",
  "expiresIn": "24h"
}
```

### Chat Management

#### GET /api/chats/status (Public)

Get service status and demo mode information

**Response:**

```json
{
  "isDemoMode": true,
  "reason": "No MONGODB_URI environment variable found",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/chats/stats

Get user chat statistics (Requires JWT)

**Response:**

```json
{
  "totalChats": 5,
  "archivedChats": 1,
  "totalMessages": 42,
  "isDemoMode": true
}
```

#### POST /api/chats

Create a new chat (Requires JWT)

**Request:**

```json
{
  "chatId": "chat_1638360000000_abc123",
  "name": "My New Chat",
  "settings": { "model": "gpt-4", "temperature": 0.7 },
  "tags": ["work", "typescript"]
}
```

#### GET /api/chats/list

Get all user chats (Requires JWT)

**Query Parameters:**

- `includeArchived` (boolean): Include archived chats

#### GET /api/chats/:chatId

Get specific chat details (Requires JWT)

#### PUT /api/chats/:chatId

Update chat information (Requires JWT)

**Request:**

```json
{
  "name": "Updated Chat Name",
  "tags": ["updated", "important"],
  "archived": false
}
```

#### DELETE /api/chats/:chatId

Delete a chat and all messages (Requires JWT)

### Message Management

#### POST /api/chats/:chatId/messages

Add a message to a chat (Requires JWT)

**Request:**

```json
{
  "id": "msg_1638360000000_abc123",
  "role": "user",
  "content": "Hello, how can you help me?",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": { "tokenCount": 25 },
  "filterId": "filter_1638360000000_def456",
  "filterSnapshot": {
    "filterId": "filter_1638360000000_def456",
    "name": "Work Filter",
    "config": {
      "dateFilter": {
        "type": "custom",
        "customRange": { "amount": 7, "type": "days" }
      },
      "selectedCountries": ["PS", "LB"],
      "enabledTools": ["tool-x", "tool-y"]
    }
  }
}
```

#### GET /api/chats/:chatId/messages

Get messages from a chat (Requires JWT)

**Query Parameters:**

- `limit` (number): Number of messages (default: 50)
- `offset` (number): Pagination offset (default: 0)

#### DELETE /api/chats/messages/:messageId

Delete a specific message (Requires JWT)

### Filter Management

#### POST /api/chats/:chatId/filters

Create a new filter (Requires JWT)

**Request:**

```json
{
  "filterId": "filter_1638360000000_abc123",
  "name": "Work Filter",
  "filterConfig": {
    "dateFilter": {
      "type": "custom",
      "customRange": { "amount": 7, "type": "days" }
    },
    "selectedCountries": ["PS", "LB"],
    "enabledTools": ["tool-x", "tool-y"],
    "filterText": "work related",
    "selectedMode": "flow"
  },
  "isActive": false
}
```

#### GET /api/chats/:chatId/filters

Get all filters for a chat (Requires JWT)

#### GET /api/chats/filters/:filterId

Get specific filter details (Requires JWT)

#### PUT /api/chats/filters/:filterId

Update filter configuration (Requires JWT)

#### DELETE /api/chats/filters/:filterId

Delete a filter (Requires JWT)

#### PUT /api/chats/:chatId/active-filter

Set the active filter for a chat (Requires JWT)

**Request:**

```json
{
  "filterId": "filter_1638360000000_abc123"
}
```

### Streaming

#### POST /api/chat/stream

Stream chat responses (Server-Sent Events)

**Request:**

```json
{
  "chatId": "chat_1638360000000_xyz789",
  "auth": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "user_123456789"
  },
  "messages": [
    {
      "id": "msg_1638360000000_abc123",
      "role": "user",
      "content": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "tools": [
    {
      "toolId": "web_search",
      "name": "Web Search",
      "enabled": true,
      "parameters": { "maxResults": 5 }
    }
  ],
  "dateFilter": {
    "type": "custom",
    "customRange": { "amount": 7, "type": "days" }
  },
  "selectedCountries": ["PS", "LB"]
}
```

**Response:** (Server-Sent Events Stream)

```json
{"chunkType":"start","data":{"message":"Stream started"},"timestamp":"...","sessionId":"..."}
{"chunkType":"token","data":{"token":"Hello"},"timestamp":"...","sessionId":"..."}
{"chunkType":"token","data":{"token":" there!"},"timestamp":"...","sessionId":"..."}
{"chunkType":"complete","data":{"message":"Stream completed"},"timestamp":"...","sessionId":"..."}
```

---

## Shared Libraries

### 1. @iagent/shared-types

**Location:** `libs/shared-types/src/lib/shared-types.ts`

**Purpose:** Common TypeScript type definitions shared across frontend and backend

**Key Exports:**

```typescript
// Message Types
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: MessageMetadata;
}

// Conversation Types
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
  metadata?: ConversationMetadata;
}

// API Types
interface ChatRequest {
  messages: Message[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Theme & Language Types
interface Theme {
  mode: "light" | "dark";
  primary: string;
  secondary: string;
  // ...
}

interface Language {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  flag: string;
}
```

### 2. @iagent/stream-mocks

**Location:** `libs/stream-mocks/src/lib/stream-mocks.ts`

**Purpose:** Streaming utilities, mock responses, and client implementation

**Key Exports:**

#### StreamingClient Class

```typescript
class StreamingClient {
  // Mock streaming
  async streamChatMock(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    t: TranslationFunction
  ): Promise<void>;

  // API streaming
  async streamChatAPI(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    baseUrl?: string,
    authToken?: string,
    chatId?: string,
    tools?: any[],
    dateFilter?: any,
    selectedCountries?: string[]
  ): Promise<void>;

  // Unified streaming method
  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    useMock?: boolean,
    baseUrl?: string,
    t?: TranslationFunction,
    authToken?: string,
    chatId?: string,
    tools?: any[],
    dateFilter?: any,
    selectedCountries?: string[]
  ): Promise<void>;

  abort(): void;
}
```

#### Utility Functions

```typescript
// Mock response generation
function generateMockResponse(input: string, t: TranslationFunction): string;

// Tokenization for streaming
function tokenizeResponse(text: string): string[];

// Streaming delay calculation
function calculateStreamingDelay(
  token: string,
  index: number,
  allTokens: string[]
): number;

// Message helpers
function createMessage(
  role: "user" | "assistant",
  content: string,
  isStreaming?: boolean,
  filterId?: string | null,
  filterSnapshot?: object | null
): Message;

function updateMessageContent(
  message: Message,
  content: string,
  isStreaming?: boolean,
  isInterrupted?: boolean
): Message;
```

#### Features:

- **Mock Mode:** Generates realistic mock responses with report links
- **Tokenization:** Natural word-by-word streaming
- **Abort Support:** Cancellable streaming via AbortController
- **Metadata:** Token progress, confidence scores, timing
- **Filter Snapshots:** Preserves filter configuration with messages

### 3. @iagent/shared-utils

**Location:** `libs/shared-utils/src/lib/shared-utils.ts`

**Purpose:** Shared utility functions

### 4. @iagent/types

**Location:** `libs/types/src/index.ts`

**Purpose:** Additional type definitions

---

## Data Flow

### 1. User Authentication Flow

```
┌─────────────┐
│ LoginForm   │
└──────┬──────┘
       │ email, password
       ▼
┌──────────────────────┐
│ POST /api/auth/login │
└──────┬───────────────┘
       │
       ▼
┌─────────────────┐
│  AuthService    │
│  - Validate     │
│  - Create JWT   │
└──────┬──────────┘
       │ token, userId, email
       ▼
┌───────────────────────┐
│ App.tsx setState      │
│ - setAuthToken()      │
│ - setUserId()         │
│ - setIsAuthenticated()│
└───────┬───────────────┘
        │
        ▼
┌─────────────────────┐
│ localStorage        │
│ - chatbot-auth-token│
│ - chatbot-user-id   │
│ - chatbot-user-email│
└─────────────────────┘
```

### 2. Message Streaming Flow

```
┌──────────────┐
│ User Types   │
│ Message      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ InputArea        │
│ - Collect input  │
│ - Get filters    │
│ - Get tools      │
└──────┬───────────┘
       │ SendMessageData
       ▼
┌──────────────────────────┐
│ App.handleSendMessage()  │
│ - Create user message    │
│ - Create assistant msg   │
│ - Update conversation    │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ StreamingClient.streamChat()│
│                             │
│ ┌─────────┐  ┌───────────┐ │
│ │Mock Mode│  │ API Mode  │ │
│ └────┬────┘  └─────┬─────┘ │
└──────┼─────────────┼────────┘
       │             │
       │             ▼
       │    ┌──────────────────┐
       │    │POST /api/chat/   │
       │    │     stream       │
       │    └────────┬─────────┘
       │             │
       │             ▼
       │    ┌──────────────────┐
       │    │ ChatController   │
       │    └────────┬─────────┘
       │             │
       │             ▼
       │    ┌──────────────────┐
       │    │ SSE Stream       │
       │    └────────┬─────────┘
       │             │
       ▼             ▼
┌──────────────────────────┐
│ onToken() Callback       │
│ - Append token to msg    │
│ - Update conversation    │
│ - Trigger re-render      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│ ChatArea         │
│ - Display tokens │
│ - Scroll to end  │
└──────────────────┘
```

### 3. Filter Management Flow

```
┌────────────────┐
│ User Creates   │
│ Filter Config  │
└────────┬───────┘
         │
         ▼
┌────────────────────────┐
│ InputArea              │
│ - Date filter          │
│ - Countries            │
│ - Tools                │
│ - Custom settings      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Save Filter            │
│ - Generate filterId    │
│ - Create name          │
│ - Store config         │
└────────┬───────────────┘
         │
         ├──► localStorage (Frontend)
         │    chatFilters_{chatId}
         │
         └──► POST /api/chats/:chatId/filters
              │
              ▼
         ┌────────────────┐
         │ ChatService    │
         │ - Store filter │
         │ - Link to chat │
         └────────┬───────┘
                  │
                  ▼
         ┌─────────────────┐
         │ MongoDB / Memory│
         │ ChatFilter      │
         └─────────────────┘

When message is sent:
┌────────────────────────┐
│ Message Creation       │
│ - filterId             │
│ - filterSnapshot       │
│   (full config copy)   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Message stored with    │
│ immutable filter state │
└────────────────────────┘
```

### 4. State Persistence Flow

```
┌──────────────┐
│ App State    │
│ - themes     │
│ - language   │
│ - sidebar    │
│ - convos     │
│ - auth       │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ useEffect() Listeners      │
│ - Watch state changes      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ localStorage.setItem()     │
│                            │
│ Keys:                      │
│ - chatbot-auth-token       │
│ - chatbot-user-id          │
│ - chatbot-conversations    │
│ - chatbot-current-convo-id │
│ - chatbot-sidebar-open     │
│ - chatbot-theme            │
│ - preferred_language       │
│ - chatFilters_{chatId}     │
└────────────────────────────┘

On App Mount:
┌────────────────────────────┐
│ useEffect(() => {}, [])    │
│ - Read localStorage        │
│ - Parse JSON               │
│ - Restore state            │
└────────────────────────────┘
```

---

## Key Technical Topics

### 1. Authentication System

#### Overview

JWT-based authentication with demo mode support

#### Implementation Details

**Frontend (`LoginForm.tsx`):**

- Email/password input form
- Calls POST /api/auth/login
- Stores token in localStorage
- Passes token in Authorization header

**Backend (`auth.service.ts`):**

- Mock user database (for demo)
- Simple JWT creation/validation
- Token expiration (24 hours)
- User validation

**Demo Credentials:**

```
Email: demo@example.com
Password: demo123

Email: admin@example.com
Password: admin123
```

**Security Notes:**

- Current implementation uses simple JWT for demo
- Production should use: `@nestjs/jwt` with proper secret management
- Passwords should be hashed with bcrypt
- Implement refresh tokens
- Add rate limiting

### 2. Database Architecture

#### Dual-Mode Operation

The application supports two modes:

**1. MongoDB Mode (Production)**

- Requires `MONGODB_URI` environment variable
- Uses Mongoose schemas
- Persistent data storage
- Indexed queries for performance

**2. Demo Mode (Development)**

- Activated when `DEMO_MODE=true` or no MongoDB URI
- In-memory storage using Map objects
- Data resets on server restart
- No database dependencies needed

#### Schemas

**Chat Schema:**

```typescript
{
  chatId: string (unique)
  name: string
  userId: string
  createdAt: Date
  lastMessageAt: Date
  settings: Record<string, any>
  tags: string[]
  archived: boolean
  messageCount: number
  activeFilterId: string | null
  associatedFilters: string[]
  currentFilterConfig: object | null
}
```

**ChatMessage Schema:**

```typescript
{
  id: string
  chatId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata: object
  filterId: string | null
  filterSnapshot: {
    filterId: string
    name: string
    config: object
  } | null
}
```

**ChatFilter Schema:**

```typescript
{
  filterId: string (unique)
  name: string
  userId: string
  chatId: string
  filterConfig: {
    dateFilter: object
    selectedCountries: string[]
    enabledTools: string[]
    filterText: string
    selectedMode: string
    customFilters: object
  }
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}
```

#### Indexes

```typescript
// ChatFilter
{ userId: 1, chatId: 1 }
{ filterId: 1 }
{ userId: 1, isActive: 1 }

// ChatMessage
{ chatId: 1, timestamp: 1 }
{ userId: 1, timestamp: -1 }
{ filterId: 1 }

// Chat
{ userId: 1, lastMessageAt: -1 }
{ userId: 1, archived: 1, lastMessageAt: -1 }
{ activeFilterId: 1 }
```

### 3. Server-Sent Events (SSE) Streaming

#### Overview

Real-time message streaming using SSE for one-way server-to-client communication

#### Implementation

**Backend Streaming:**

```typescript
// ChatController would implement:
@Post('stream')
async streamChat(@Body() request: ChatRequestDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Stream chunks
  for (const chunk of generateResponse()) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  res.end();
}
```

**Frontend Streaming:**

```typescript
const response = await fetch("/api/chat/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request),
  signal: abortController.signal,
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process chunk
  onToken(chunk);
}
```

#### Chunk Types

```typescript
{
  chunkType: 'start' | 'metadata' | 'token' | 'progress' | 'complete' | 'error'
  data: { ... }
  timestamp: string
  sessionId: string
}
```

### 4. Internationalization (i18n)

#### Supported Languages

- **English (en)** - LTR
- **Arabic (ar)** - RTL
- **Hebrew (he)** - RTL

#### Implementation

**TranslationContext:**

- Manages current language
- Loads translation files dynamically
- Provides `t()` function for translations
- Handles RTL/LTR direction switching

**Translation Files:**

```typescript
// apps/frontend/src/i18n/translations/en.ts
export default {
  sidebar: {
    newChatTitle: "New Chat",
    searchPlaceholder: "Search conversations...",
  },
  chat: {
    inputPlaceholder: "Type your message...",
    send: "Send",
  },
  // ...
};
```

**Usage:**

```typescript
const { t, changeLanguage } = useTranslation();

<Typography>{t('sidebar.newChatTitle')}</Typography>

changeLanguage('ar'); // Switch to Arabic
```

**Direction Handling:**

```typescript
// Automatically sets:
document.documentElement.dir = "rtl"; // for ar, he
document.documentElement.dir = "ltr"; // for en
document.documentElement.lang = "ar";
```

### 5. Material-UI Theme System

#### iAgent Design Tokens

**Typography:**

```typescript
fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
sizes: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px' }
weights: { normal: 400, medium: 500, semibold: 600 }
lineHeight: 1.7
```

**Spacing:**

```typescript
xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', 2xl: '48px'
```

**Border Radius:**

```typescript
sm: '6px', md: '8px', lg: '12px', xl: '16px', 2xl: '24px', 3xl: '32px'
```

**Colors (Dark Theme):**

```typescript
background: {
  primary: '#0a0a0a',
  secondary: '#171717',
  tertiary: '#262626'
}
text: {
  primary: '#fafafa',
  secondary: '#a3a3a3'
}
accent: '#3b82f6'
```

**Colors (Light Theme):**

```typescript
background: {
  primary: '#ffffff',
  secondary: '#f9fafb',
  tertiary: '#f3f4f6'
}
text: {
  primary: '#111827',
  secondary: '#6b7280'
}
accent: '#3b82f6'
```

### 6. Mock Mode Development

#### Purpose

Allows development without backend server or database

#### Features

- **Realistic Responses:** Context-aware mock responses
- **Report Links:** Generated report:// links for testing
- **Streaming Simulation:** Natural word-by-word streaming
- **Filter Support:** Full filter snapshot preservation
- **Metadata:** Simulated confidence scores, timing, token counts

#### Mock Response Generation

```typescript
// libs/stream-mocks/src/lib/stream-mocks.ts
function generateMockResponse(input: string, t: TranslationFunction): string {
  if (input.includes("security")) {
    return `Security audit report with [link](report://security-audit-2024)`;
  }
  if (input.includes("performance")) {
    return `Performance metrics with [link](report://performance-analysis-2024)`;
  }
  // ... more patterns
}
```

#### Toggle Mock Mode

```typescript
const { useMockMode, toggleMockMode } = useMockMode();

// In StreamingClient:
await streamingClient.streamChat(
  messages,
  onToken,
  onComplete,
  onError,
  useMockMode, // Toggle flag
  baseUrl,
  t
);
```

### 7. Filter Snapshot System

#### Purpose

Preserve exact filter configuration used for each message

#### Implementation

**When message is sent:**

1. Capture current filter configuration
2. Generate unique `filterId`
3. Create snapshot object
4. Attach to message

**Filter Snapshot Structure:**

```typescript
{
  filterId: 'filter_1638360000000_abc123',
  name: 'Work Filter - Jan 2024',
  config: {
    dateFilter: {
      type: 'custom',
      customRange: { amount: 7, type: 'days' }
    },
    selectedCountries: ['PS', 'LB', 'SA'],
    enabledTools: ['tool-x', 'tool-y'],
    filterText: 'work related queries',
    selectedMode: 'flow',
    excludeAmi: false,
    includeAmi: true
  }
}
```

**Storage:**

- **Frontend:** localStorage (`chatFilters_{chatId}`)
- **Backend:** MongoDB ChatFilter collection or demo mode Map

**Benefits:**

- Historical accuracy: Know exact parameters used
- Reproducibility: Re-run queries with same filters
- Auditability: Track filter changes over time
- Debugging: Understand why results appeared

### 8. Nx Monorepo Management

#### Configuration

**nx.json:**

```json
{
  "namedInputs": { ... },
  "plugins": [
    "@nx/js/typescript",
    "@nx/eslint/plugin",
    "@nx/vite/plugin",
    "@nx/jest/plugin"
  ],
  "targetDefaults": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

#### Key Commands

```bash
# Serve apps
npx nx serve @iagent/frontend
npx nx serve @iagent/backend

# Build
npx nx build @iagent/frontend
npx nx build @iagent/backend
npx nx run-many -t build

# Test
npx nx test @iagent/frontend
npx nx run-many -t test

# Lint
npx nx lint @iagent/frontend
npx nx run-many -t lint

# Utilities
npx nx graph              # View dependency graph
npx nx affected:build     # Build affected projects
npx nx affected:test      # Test affected projects
```

#### Benefits

- **Code Sharing:** Shared libraries reduce duplication
- **Type Safety:** Shared types across frontend/backend
- **Build Optimization:** Only rebuild affected projects
- **Task Running:** Parallel task execution
- **Dependency Graph:** Visual project relationships

---

## Configuration

### Environment Variables

#### Frontend (.env)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_MOCK_MODE=false
```

#### Backend (.env)

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/iagent
DEMO_MODE=false

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:4200
```

### TypeScript Configuration

**tsconfig.base.json** (Workspace)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["es2022"],
    "skipLibCheck": true
  }
}
```

**Frontend TypeScript:**

- Uses Vite's TypeScript support
- React types from @types/react
- Strict mode enabled

**Backend TypeScript:**

- NestJS decorators support
- Node.js types
- Mongoose types

### Package Management

**Root package.json:**

```json
{
  "name": "iagent",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "libs/*"],
  "dependencies": {
    "react": "19.0.0",
    "@nestjs/core": "11.0.0"
    // ...
  }
}
```

---

## Development Guide

### Getting Started

```bash
# 1. Clone repository
git clone https://github.com/your-username/iAgent.git
cd iAgent

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env files in apps/frontend and apps/backend

# 4. Start development servers
# Terminal 1 - Frontend
npx nx serve @iagent/frontend
# Access at: http://localhost:4200/iAgent/

# Terminal 2 - Backend
npx nx serve @iagent/backend
# Access at: http://localhost:3001
# Swagger docs: http://localhost:3001/api/docs
```

### Code Organization Principles

1. **Separation of Concerns**

   - Components handle UI only
   - Services handle business logic
   - Hooks manage reusable state logic

2. **Type Safety**

   - Use shared types from `@iagent/shared-types`
   - Avoid `any` types
   - Prefer interfaces over types for objects

3. **Component Structure**

   ```typescript
   // Imports
   import React from 'react';

   // Types/Interfaces
   interface MyComponentProps { ... }

   // Component
   export const MyComponent: React.FC<MyComponentProps> = ({ ... }) => {
     // Hooks
     // Event handlers
     // Render
   };
   ```

4. **File Naming**
   - Components: PascalCase.tsx
   - Utilities: camelCase.ts
   - Hooks: useCamelCase.ts
   - Services: camelCase.service.ts

### Testing Strategy

```bash
# Run all tests
npx nx run-many -t test

# Run specific app tests
npx nx test @iagent/frontend
npx nx test @iagent/backend

# Run with coverage
npx nx test @iagent/frontend --coverage
```

### Building for Production

```bash
# Build all projects
npx nx run-many -t build

# Build specific app
npx nx build @iagent/frontend
npx nx build @iagent/backend

# Output locations
# Frontend: dist/apps/frontend/
# Backend: dist/apps/backend/
```

### Deployment

#### Frontend (Static Site)

```bash
# Build
npx nx build @iagent/frontend

# Deploy to GitHub Pages (example)
npm run deploy:gh-pages

# Or deploy dist/apps/frontend/ to:
# - Vercel, Netlify, AWS S3, etc.
```

#### Backend (Node.js Server)

```bash
# Build
npx nx build @iagent/backend

# Run production server
cd dist/apps/backend
node main.js

# Environment
# Set production environment variables
# Set MONGODB_URI for production database
```

### Common Tasks

#### Add New Component

```bash
npx nx g @nx/react:component MyComponent \
  --project=frontend \
  --directory=src/components
```

#### Add New Library

```bash
npx nx g @nx/react:lib my-lib \
  --directory=libs/my-lib
```

#### Update Dependencies

```bash
npm update
npx nx migrate latest
```

---

## Additional Resources

### Documentation

- [Main README](./README.md)
- [Frontend README](./apps/frontend/README.md)
- [Backend README](./apps/backend/README.md)
- [Style Guide](./STYLE_GUIDE.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [CI/CD Guide](./docs/CI-CD.md)

### External Links

- [Nx Documentation](https://nx.dev)
- [React Documentation](https://react.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Material-UI Documentation](https://mui.com)
- [MongoDB Documentation](https://www.mongodb.com/docs)

---

**Last Updated:** October 15, 2025  
**Maintained by:** iAgent Team  
**License:** MIT
