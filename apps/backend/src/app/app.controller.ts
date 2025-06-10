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
    summary: 'Send a chat message with real-time streaming',
    description: 'Send a message to the AI assistant and receive a streaming response. Each token is sent individually with realistic timing to simulate real chatbot generation.'
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({ 
    type: ChatRequestDto,
    description: 'Chat request containing conversation history'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully started streaming response',
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

    try {
      // Generate contextual response based on conversation
      const response = await this.generateContextualResponse(messages);
      
      // Tokenize the response for realistic streaming
      const tokens = this.tokenizeResponse(response);
      const startTime = new Date();
      
      // Initial thinking delay (like real AI processing)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      let currentContent = '';
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const isLast = i === tokens.length - 1;
        
        currentContent += token;
        
        // Create streaming response chunk
        const responseChunk = {
          token,
          done: isLast,
          metadata: {
            index: i + 1,
            total_tokens: tokens.length,
            timestamp: new Date().toISOString(),
            model: 'chatgpt-clone-v1',
            usage: {
              prompt_tokens: this.countTokens(messages),
              completion_tokens: i + 1,
              total_tokens: this.countTokens(messages) + i + 1
            },
            processing_time_ms: Date.now() - startTime.getTime(),
            confidence: 0.92 + Math.random() * 0.07,
            categories: this.categorizeContent(lastMessage.content),
            progress: Math.round(((i + 1) / tokens.length) * 100)
          }
        };
        
        // Send token
        res.write(JSON.stringify(responseChunk) + '\n');
        
        // Realistic streaming delays based on token type
        if (!isLast) {
          const delay = this.calculateStreamingDelay(token, i, tokens);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      
      // Send error response
      const errorChunk = {
        token: '',
        done: true,
        error: {
          message: 'An error occurred while generating the response',
          code: 'GENERATION_ERROR'
        }
      };
      
      res.write(JSON.stringify(errorChunk) + '\n');
      res.end();
    }
  }

  /**
   * Generate contextual response based on conversation history
   */
  private async generateContextualResponse(messages: ChatMessage[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();
    const conversationContext = messages.slice(-3); // Last 3 messages for context
    
    // Analyze conversation patterns
    const hasCodeContext = conversationContext.some(m => 
      m.content.includes('```') || 
      m.content.toLowerCase().includes('code') ||
      m.content.toLowerCase().includes('function') ||
      m.content.toLowerCase().includes('typescript')
    );
    
    const isFollowUp = messages.length > 1;
    const isGreeting = userContent.match(/\b(hello|hi|hey|good morning|good afternoon)\b/);
    
    // Generate response based on context
    if (isGreeting && !isFollowUp) {
      return this.getGreetingResponse();
    } else if (hasCodeContext || userContent.includes('code')) {
      return this.getCodeResponse(userContent);
    } else if (userContent.includes('help') || userContent.includes('how')) {
      return this.getHelpResponse(userContent);
    } else if (userContent.includes('explain') || userContent.includes('what is')) {
      return this.getExplanationResponse(userContent);
    } else if (isFollowUp) {
      return this.getFollowUpResponse(userContent, conversationContext);
    } else {
      return this.getGeneralResponse(userContent);
    }
  }

  /**
   * Tokenize response for realistic streaming
   */
  private tokenizeResponse(text: string): string[] {
    const tokens: string[] = [];
    
    // Split by words and punctuation while preserving structure
    const parts = text.split(/(\s+|[\n\r]+|[.,!?;:])/);
    
    for (const part of parts) {
      if (part.trim()) {
        // For longer words, sometimes split into smaller chunks for more realistic streaming
        if (part.length > 8 && Math.random() > 0.7) {
          const mid = Math.floor(part.length / 2);
          tokens.push(part.slice(0, mid));
          tokens.push(part.slice(mid));
        } else {
          tokens.push(part);
        }
      } else {
        tokens.push(part); // Preserve whitespace and newlines
      }
    }
    
    return tokens.filter(token => token.length > 0);
  }

  /**
   * Calculate realistic streaming delay based on token content
   */
  private calculateStreamingDelay(token: string, index: number, allTokens: string[]): number {
    const baseDelay = 25; // Base delay between tokens
    const randomFactor = Math.random() * 30; // Add randomness
    
    // Longer delays for:
    // - Punctuation (thinking time)
    // - After newlines (processing new thoughts)
    // - Complex words
    // - Code blocks
    
    let delay = baseDelay + randomFactor;
    
    if (/[.!?]/.test(token)) {
      delay += 100 + Math.random() * 200; // Pause after sentences
    } else if (/[,;:]/.test(token)) {
      delay += 50 + Math.random() * 100; // Shorter pause for commas
    } else if (token.includes('\n')) {
      delay += 150 + Math.random() * 250; // Longer pause for new paragraphs
    } else if (token.startsWith('```')) {
      delay += 200 + Math.random() * 300; // Processing code blocks
    } else if (token.length > 6) {
      delay += 20 + Math.random() * 40; // Longer words take more time
    }
    
    // Gradual speed increase as response progresses (AI "warming up")
    const progressFactor = Math.max(0.5, 1 - (index / allTokens.length) * 0.3);
    delay *= progressFactor;
    
    return Math.round(delay);
  }

  /**
   * Count tokens in messages for usage stats
   */
  private countTokens(messages: ChatMessage[]): number {
    return messages.reduce((total, msg) => 
      total + msg.content.split(/\s+/).length, 0
    );
  }

  /**
   * Categorize content for metadata
   */
  private categorizeContent(content: string): string[] {
    const categories: string[] = [];
    const lower = content.toLowerCase();
    
    if (lower.match(/\b(code|function|class|typescript|javascript|programming)\b/)) {
      categories.push('programming', 'technical');
    }
    if (lower.match(/\b(help|how|what|explain|tutorial)\b/)) {
      categories.push('educational', 'assistance');
    }
    if (lower.match(/\b(hello|hi|hey|thanks|please)\b/)) {
      categories.push('conversational', 'social');
    }
    if (lower.match(/\b(math|calculate|equation|formula)\b/)) {
      categories.push('mathematical', 'analytical');
    }
    
    return categories.length > 0 ? categories : ['general'];
  }

  // Response generators for different contexts
  private getGreetingResponse(): string {
    const greetings = [
      "Hello! I'm ChatGPT Clone, an AI assistant built with React and NestJS. I'm here to help you with coding, explanations, creative writing, and much more. What would you like to explore today?",
      "Hi there! 👋 Welcome to our ChatGPT Clone demo. I'm powered by a modern tech stack and ready to assist you. Feel free to ask me anything!",
      "Hey! Great to meet you. I'm an AI assistant that can help with programming, writing, math, and general questions. What's on your mind?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private getCodeResponse(userContent: string): string {
    const codeResponses = [
      `I'd be happy to help you with coding! Here's a practical example:

\`\`\`typescript
// Modern TypeScript with proper typing
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      status: 'success'
    };
  } catch (error) {
    return {
      data: null as T,
      status: 'error',
      message: error.message
    };
  }
}
\`\`\`

This demonstrates modern async/await patterns with TypeScript generics. The code is type-safe and handles errors gracefully.`,

      `Let me show you a clean React component pattern:

\`\`\`tsx
import React, { useState, useCallback } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = useCallback(async (updates: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await updateUser(userId, updates);
      setUser(updatedUser);
      onUpdate?.(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [userId, onUpdate]);

  return (
    <div className="user-profile">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <UserForm user={user} onSubmit={handleUpdate} />
      )}
    </div>
  );
};
\`\`\`

This shows proper TypeScript typing, React hooks, and performance optimization with useCallback.`
    ];
    
    return codeResponses[Math.floor(Math.random() * codeResponses.length)];
  }

  private getHelpResponse(userContent: string): string {
    return `I'm here to help! Based on your question, here are some ways I can assist:

## 💻 **Programming & Development**
- Code examples and explanations
- Debugging assistance
- Best practices and patterns
- Framework-specific guidance

## 📚 **Learning & Education**
- Step-by-step tutorials
- Concept explanations
- Problem-solving strategies

## 🛠️ **Technical Support**
- Architecture recommendations
- Performance optimization
- Tool and library suggestions

## ✍️ **Writing & Communication**
- Content creation
- Documentation help
- Technical writing

Feel free to ask specific questions, and I'll provide detailed, practical answers!`;
  }

  private getExplanationResponse(userContent: string): string {
    return `Great question! Let me break this down for you:

When working with modern web development, there are several key concepts that are essential to understand:

### **Component Architecture**
Modern applications are built using a component-based approach where:
- Each component has a single responsibility
- Components communicate through props and events
- State management is handled predictably

### **Type Safety**
TypeScript provides compile-time safety by:
- Catching errors before runtime
- Providing better IDE support
- Making code more maintainable

### **Reactive Programming**
Modern frameworks use reactive patterns:
- Data flows in one direction
- State changes trigger UI updates
- Effects are managed declaratively

### **Performance Optimization**
Key strategies include:
- Code splitting and lazy loading
- Memoization and caching
- Efficient rendering patterns

Would you like me to dive deeper into any of these concepts?`;
  }

  private getFollowUpResponse(userContent: string, context: ChatMessage[]): string {
    return `Building on our previous conversation, let me expand on that:

You mentioned something interesting earlier. In the context of what we've been discussing, there are a few additional points worth considering:

**Key Insights:**
- The approach we discussed can be extended further
- There are some nuances that might be relevant to your specific use case
- Best practices often depend on the particular context

**Practical Applications:**
- This pattern is commonly used in production applications
- Many developers find success with this approach
- The scalability aspects are worth considering

**Next Steps:**
If you'd like to explore this further, I can provide:
- More detailed examples
- Alternative approaches
- Specific implementation guidance

What aspect would you like to focus on next?`;
  }

  private getGeneralResponse(userContent: string): string {
    const responses = [
      `That's an interesting topic! Let me share some thoughts:

Modern technology has revolutionized how we approach problem-solving. Whether you're working on:

- **Software Development**: Building scalable, maintainable applications
- **Data Analysis**: Extracting insights from complex datasets  
- **User Experience**: Creating intuitive, accessible interfaces
- **System Architecture**: Designing robust, efficient systems

The key is always to start with clear objectives and choose the right tools for the job.

What specific area interests you most?`,

      `I'd be happy to help you explore this further! Here's my perspective:

When tackling any challenge, I recommend following these principles:

1. **Understand the Problem**: Break it down into smaller, manageable parts
2. **Research Solutions**: Look at existing approaches and best practices
3. **Plan Your Approach**: Create a clear roadmap before implementation
4. **Iterate and Improve**: Test, gather feedback, and refine

This methodology works well whether you're:
- Learning a new technology
- Solving a technical problem
- Planning a project
- Making strategic decisions

What would you like to dive deeper into?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
