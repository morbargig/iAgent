import { Controller, Get, Post, Body, Sse, Res, Headers, HttpStatus, ValidationPipe, UsePipes } from '@nestjs/common';
import { Observable, interval, map, take, switchMap, of, delay, from } from 'rxjs';
import type { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiProduces,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { 
  ChatRequestDto, 
  ChatResponseDto, 
  StreamTokenDto, 
  ErrorResponseDto, 
  HealthCheckDto 
} from './dto/chat.dto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageEvent {
  data: string;
}

@ApiTags('Chat API')
@ApiExtraModels(ChatRequestDto, ChatResponseDto, StreamTokenDto, ErrorResponseDto, HealthCheckDto)
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Returns the health status and available endpoints of the API'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    type: HealthCheckDto,
    schema: {
      $ref: getSchemaPath(HealthCheckDto)
    }
  })
  getData(): HealthCheckDto {
    return {
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      endpoints: {
        health: '/api',
        chat: '/api/chat',
        stream: '/api/chat/stream',
        sse: '/api/chat/sse-stream',
        docs: '/api/docs'
      }
    };
  }

  @Post('chat')
  @ApiOperation({ 
    summary: 'Send a chat message',
    description: 'Send a message to the AI assistant and receive a complete response. This endpoint returns the full response at once.'
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({ 
    type: ChatRequestDto,
    description: 'Chat request containing conversation history',
    schema: {
      $ref: getSchemaPath(ChatRequestDto)
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully generated AI response',
    type: String,
    content: {
      'application/json': {
        schema: {
          type: 'string',
          example: 'Hello! I\'d be happy to help you with TypeScript. What specific topic would you like to learn about?'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request format or validation error',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto)
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseDto
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async chat(@Body() request: ChatRequestDto): Promise<string> {
    const { messages } = request;
    const lastMessage = messages[messages.length - 1];
    
    // Enhanced mock responses with markdown examples
    const responses = [
      `Hello! I'm a **ChatGPT Clone** built with React and NestJS in an Nx monorepo. How can I help you today?

Here are some things I can help with:
- 💻 Code explanations and debugging
- 📝 Writing and editing
- 🧮 Math and calculations
- 🎨 Creative projects`,

      `That's an interesting question! Let me think about that...

Here's a quick **code example** in TypeScript:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (userData: Partial<User>): User => {
  return {
    id: generateId(),
    ...userData
  } as User;
};
\`\`\`

This demonstrates type safety and object composition.`,

      `I'm a mock AI assistant designed to demonstrate the **frontend-backend communication** in this Nx workspace.

## Key Features:
1. **Real-time streaming** - Token-by-token generation
2. **Markdown support** - Rich text formatting
3. **Modern UI** - ChatGPT-like interface
4. **Monorepo architecture** - Nx workspace organization

> This is a blockquote example showing how markdown is rendered in the chat interface.`,

      `This project showcases a **modern tech stack**:

### Frontend:
- React 19 with TypeScript
- Material-UI components
- Vite for fast development
- Real-time streaming support

### Backend:
- NestJS framework
- Server-Sent Events (SSE)
- CORS enabled
- TypeScript throughout

### Development:
- Nx monorepo tooling
- ESLint & Prettier
- Jest for testing

*All managed efficiently in a single workspace!*`,

      `Feel free to ask me anything! I'll provide helpful responses to demonstrate the chat functionality.

Here's a **mathematical equation** example:

The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

And here's a **table example**:

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | ✅ | Token-by-token generation |
| Markdown | ✅ | Full support |
| Dark Theme | ✅ | ChatGPT-like styling |
| Mobile | ✅ | Responsive design |

**Lists work too:**
- [x] Completed feature
- [x] Another completed item
- [ ] Future enhancement
- [ ] Another planned feature`,
    ];

    // Simple response logic based on user input
    let response: string;
    const userContent = lastMessage.content.toLowerCase();
    
    if (userContent.includes('hello') || userContent.includes('hi')) {
      response = responses[0];
    } else if (userContent.includes('code') || userContent.includes('typescript') || userContent.includes('programming')) {
      response = responses[1];
    } else if (userContent.includes('nx') || userContent.includes('monorepo') || userContent.includes('architecture')) {
      response = responses[2];
    } else if (userContent.includes('tech') || userContent.includes('stack') || userContent.includes('framework')) {
      response = responses[3];
    } else if (userContent.includes('markdown') || userContent.includes('table') || userContent.includes('math')) {
      response = responses[4];
    } else {
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    // Add a realistic delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return response;
  }

  @Post('chat/stream')
  @ApiOperation({ 
    summary: 'Send a chat message with streaming response',
    description: 'Send a message to the AI assistant and receive a streaming response with structured JSON data. Each chunk contains the token, completion status, and metadata.'
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({ 
    type: ChatRequestDto,
    description: 'Chat request containing conversation history for streaming response',
    schema: {
      $ref: getSchemaPath(ChatRequestDto)
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully started streaming AI response with structured data',
    content: {
      'application/json': {
        schema: { 
          type: 'object',
          properties: {
            token: { type: 'string', example: 'Hello' },
            done: { type: 'boolean', example: false },
            metadata: {
              type: 'object',
              properties: {
                index: { type: 'number', example: 1 },
                total_tokens: { type: 'number', example: 150 },
                timestamp: { type: 'string', example: '2024-01-01T12:00:00Z' },
                model: { type: 'string', example: 'chatgpt-clone-v1' }
              }
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request format or validation error',
    type: ErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during streaming',
    type: ErrorResponseDto
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async streamChat(@Body() request: ChatRequestDto, @Res() res: Response) {
    const { messages } = request;
    const lastMessage = messages[messages.length - 1];
    
    // Set streaming headers for JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');

    // Enhanced mock responses with markdown examples
    const responses = [
      `Hello! I'm a **ChatGPT Clone** built with React and NestJS in an Nx monorepo. How can I help you today?

Here are some things I can help with:
- 💻 Code explanations and debugging
- 📝 Writing and editing
- 🧮 Math and calculations
- 🎨 Creative projects`,

      `That's an interesting question! Let me think about that...

Here's a quick **code example** in TypeScript:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (userData: Partial<User>): User => {
  return {
    id: generateId(),
    ...userData
  } as User;
};
\`\`\`

This demonstrates type safety and object composition.`,

      `I'm a mock AI assistant designed to demonstrate the **frontend-backend communication** in this Nx workspace.

## Key Features:
1. **Real-time streaming** - Token-by-token generation
2. **Markdown support** - Rich text formatting
3. **Modern UI** - ChatGPT-like interface
4. **Monorepo architecture** - Nx workspace organization

> This is a blockquote example showing how markdown is rendered in the chat interface.`,

      `This project showcases a **modern tech stack**:

### Frontend:
- React 19 with TypeScript
- Material-UI components
- Vite for fast development
- Real-time streaming support

### Backend:
- NestJS framework
- Server-Sent Events (SSE)
- CORS enabled
- TypeScript throughout

### Development:
- Nx monorepo tooling
- ESLint & Prettier
- Jest for testing

*All managed efficiently in a single workspace!*`,

      `Feel free to ask me anything! I'll provide helpful responses to demonstrate the chat functionality.

Here's a **mathematical equation** example:

The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

And here's a **table example**:

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | ✅ | Token-by-token generation |
| Markdown | ✅ | Full support |
| Dark Theme | ✅ | ChatGPT-like styling |
| Mobile | ✅ | Responsive design |

**Lists work too:**
- [x] Completed feature
- [x] Another completed item
- [ ] Future enhancement
- [ ] Another planned feature`,
    ];

    // Simple response logic based on user input
    let response: string;
    const userContent = lastMessage.content.toLowerCase();
    
    if (userContent.includes('hello') || userContent.includes('hi')) {
      response = responses[0];
    } else if (userContent.includes('code') || userContent.includes('typescript') || userContent.includes('programming')) {
      response = responses[1];
    } else if (userContent.includes('nx') || userContent.includes('monorepo') || userContent.includes('architecture')) {
      response = responses[2];
    } else if (userContent.includes('tech') || userContent.includes('stack') || userContent.includes('framework')) {
      response = responses[3];
    } else if (userContent.includes('markdown') || userContent.includes('table') || userContent.includes('math')) {
      response = responses[4];
    } else {
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    // Stream the response word by word with complex metadata
    const words = response.split(' ');
    const startTime = new Date();
    
    try {
      // Initial delay before starting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const isLast = i === words.length - 1;
        
        // Create complex response object
        const responseChunk = {
          token: word + (isLast ? '' : ' '),
          done: isLast,
          metadata: {
            index: i + 1,
            total_tokens: words.length,
            timestamp: new Date().toISOString(),
            model: 'chatgpt-clone-v1',
            usage: {
              prompt_tokens: messages.reduce((acc, msg) => acc + msg.content.split(' ').length, 0),
              completion_tokens: i + 1,
              total_tokens: messages.reduce((acc, msg) => acc + msg.content.split(' ').length, 0) + i + 1
            },
            processing_time_ms: Date.now() - startTime.getTime(),
            confidence: 0.95 + Math.random() * 0.05, // Mock confidence score
            categories: userContent.includes('code') ? ['technical', 'programming'] : ['general', 'conversation']
          }
        };
        
        // Send JSON chunk
        res.write(JSON.stringify(responseChunk) + '\n');
        
        // Random delay between words (50-200ms)
        if (!isLast) {
          await new Promise(resolve => 
            setTimeout(resolve, 50 + Math.random() * 150)
          );
        }
      }
      
      // End the response
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.end();
    }
  }

  @Sse('chat/sse-stream')
  @ApiOperation({ 
    summary: 'Send a chat message with Server-Sent Events streaming',
    description: 'Send a message to the AI assistant and receive a streaming response via Server-Sent Events (SSE). Each token is sent as a separate event with metadata.'
  })
  @ApiProduces('text/event-stream')
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully started SSE streaming',
    content: {
      'text/event-stream': {
        schema: { 
          type: 'object',
          properties: {
            data: { 
              type: 'string',
              description: 'JSON stringified StreamTokenDto containing token and metadata',
              example: '{"token": "Hello", "done": false, "metadata": {"index": 1, "total_tokens": 150}}'
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request format or validation error',
    type: ErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during SSE streaming',
    type: ErrorResponseDto
  })
  sseStreamChat(@Body() request: ChatRequestDto): Observable<MessageEvent> {
    const { messages } = request;
    const lastMessage = messages[messages.length - 1];
    
    // Enhanced mock responses with markdown examples
    const responses = [
      `Hello! I'm a **ChatGPT Clone** built with React and NestJS in an Nx monorepo. How can I help you today?

Here are some things I can help with:
- 💻 Code explanations and debugging
- 📝 Writing and editing
- 🧮 Math and calculations
- 🎨 Creative projects`,

      `That's an interesting question! Let me think about that...

Here's a quick **code example** in TypeScript:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (userData: Partial<User>): User => {
  return {
    id: generateId(),
    ...userData
  } as User;
};
\`\`\`

This demonstrates type safety and object composition.`,

      `I'm a mock AI assistant designed to demonstrate the **frontend-backend communication** in this Nx workspace.

## Key Features:
1. **Real-time streaming** - Token-by-token generation
2. **Markdown support** - Rich text formatting
3. **Modern UI** - ChatGPT-like interface
4. **Monorepo architecture** - Nx workspace organization

> This is a blockquote example showing how markdown is rendered in the chat interface.`,

      `This project showcases a **modern tech stack**:

### Frontend:
- React 19 with TypeScript
- Material-UI components
- Vite for fast development
- Real-time streaming support

### Backend:
- NestJS framework
- Server-Sent Events (SSE)
- CORS enabled
- TypeScript throughout

### Development:
- Nx monorepo tooling
- ESLint & Prettier
- Jest for testing

*All managed efficiently in a single workspace!*`,

      `Feel free to ask me anything! I'll provide helpful responses to demonstrate the chat functionality.

Here's a **mathematical equation** example:

The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

And here's a **table example**:

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | ✅ | Token-by-token generation |
| Markdown | ✅ | Full support |
| Dark Theme | ✅ | ChatGPT-like styling |
| Mobile | ✅ | Responsive design |

**Lists work too:**
- [x] Completed feature
- [x] Another completed item
- [ ] Future enhancement
- [ ] Another planned feature`,
    ];

    // Simple response logic based on user input
    let response: string;
    const userContent = lastMessage.content.toLowerCase();
    
    if (userContent.includes('hello') || userContent.includes('hi')) {
      response = responses[0];
    } else if (userContent.includes('code') || userContent.includes('typescript') || userContent.includes('programming')) {
      response = responses[1];
    } else if (userContent.includes('nx') || userContent.includes('monorepo') || userContent.includes('architecture')) {
      response = responses[2];
    } else if (userContent.includes('tech') || userContent.includes('stack') || userContent.includes('framework')) {
      response = responses[3];
    } else if (userContent.includes('markdown') || userContent.includes('table') || userContent.includes('math')) {
      response = responses[4];
    } else {
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    // Split response into words for streaming
    const words = response.split(' ');
    
    return of(null).pipe(
      delay(300), // Initial delay
      switchMap(() => 
        interval(50 + Math.random() * 100).pipe( // Random delay between words (50-150ms)
          take(words.length + 1),
          map((index) => {
            if (index < words.length) {
              return {
                data: JSON.stringify({
                  token: words[index] + (index < words.length - 1 ? ' ' : ''),
                  done: false,
                  metadata: {
                    index: index + 1,
                    total_tokens: words.length
                  }
                }),
              };
            } else {
              return {
                data: JSON.stringify({
                  token: '',
                  done: true,
                  metadata: {
                    index: words.length,
                    total_tokens: words.length
                  }
                }),
              };
            }
          })
        )
      )
    );
  }
}
