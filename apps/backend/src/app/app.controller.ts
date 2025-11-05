import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
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
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

import { ChatService } from './services/chat.service';
import { AuthService } from './auth/auth.service';
import type { LoginRequest, LoginResponse } from './auth/auth.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  StreamTokenDto,
  ErrorResponseDto,
  HealthCheckDto,
  AuthTokenDto,
  ToolSelectionDto
} from './dto/chat.dto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}


@ApiTags('Chat API')
@ApiExtraModels(ChatRequestDto, ChatResponseDto, StreamTokenDto, ErrorResponseDto, HealthCheckDto, AuthTokenDto, ToolSelectionDto)
@Controller()
export class AppController {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService
  ) { }

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
        login: '/api/auth/login',
        stream: '/api/chat/stream',
        docs: '/api/docs'
      }
    };
  }

  @Post('auth/login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and receive JWT token'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        userId: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        expiresIn: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    return await this.authService.login(loginRequest);
  }


  @Post('chat/stream')
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send a chat message with structured streaming response',
    description: 'Send a message to the AI assistant and receive a streaming response with structured chunks. Each chunk has a specific type (start, token, metadata, progress, complete, error) for better control and visualization. Requires authentication.'
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: ChatRequestDto,
    description: 'Chat request with authentication, chat ID, messages, and optional tools'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully started structured streaming response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            chunkType: {
              type: 'string',
              enum: ['start', 'token', 'metadata', 'progress', 'complete', 'error'],
              example: 'token',
              description: 'Type of chunk being sent'
            },
            data: {
              type: 'object',
              example: {
                token: 'Hello',
                index: 1,
                totalTokens: 150,
                progress: 1,
                tokenType: 'word',
                confidence: 0.95
              },
              description: 'Chunk-specific data payload'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:00:00Z'
            },
            sessionId: {
              type: 'string',
              example: 'session_1640995200000_abc123',
              description: 'Unique session identifier for this streaming response'
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required'
  })
  async streamChat(@Body() request: ChatRequestDto, @Res() res: Response) {
    const { chatId, auth, messages, tools, requestTimestamp } = request;

    // Log the enhanced request data
    console.log('🔥 Enhanced Chat Request:', {
      chatId,
      userId: auth.userId,
      messageCount: messages.length,
      toolsEnabled: tools?.length || 0,
      timestamp: requestTimestamp || new Date().toISOString()
    });

    // Convert DTOs to internal format with proper typing
    const processedMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    }));

    const lastMessage = processedMessages[processedMessages.length - 1];
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save user message with filter data if it's a user message
    if (lastMessage.role === 'user') {
      try {
        // Check if the message has filter data (from frontend)
        const messageWithFilter = messages[messages.length - 1];
        let filterId = null;
        let filterSnapshot = null;

        if (messageWithFilter.filterId && messageWithFilter.filterSnapshot) {
          // Create/save the filter for this chat
          const filterData = {
            filterId: messageWithFilter.filterId,
            name: messageWithFilter.filterSnapshot.name || 'Unnamed Filter',
            filterConfig: messageWithFilter.filterSnapshot.config || {},
            chatId: chatId,
            userId: auth.userId
          };

          const savedFilter = await this.chatService.createFilter(filterData);
          filterId = savedFilter.filterId;
          filterSnapshot = messageWithFilter.filterSnapshot;

          // Set as active filter for the chat
          await this.chatService.setActiveFilter(chatId, filterId, auth.userId);

          console.log('💾 Filter saved and set as active:', filterId);
        }

        // Save the user message with filter information
        await this.chatService.addMessage({
          id: lastMessage.id,
          chatId: chatId,
          userId: auth.userId,
          role: lastMessage.role,
          content: lastMessage.content,
          timestamp: lastMessage.timestamp,
          metadata: {},
          filterId,
          filterSnapshot: filterSnapshot || undefined
        });

        console.log('💬 User message saved with filter data');
      } catch (error) {
        console.error('Failed to save user message with filter data:', error);
      }
    }

    // Set streaming headers for JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');

    try {
      // Send start chunk
      const startChunk = {
        chunkType: 'start',
        data: {
          message: 'Starting response generation',
          model: 'chatgpt-clone-v1',
          promptTokens: this.countTokens(processedMessages),
          categories: this.categorizeContent(lastMessage.content),
          conversationLength: processedMessages.length
        },
        timestamp: new Date().toISOString(),
        sessionId
      };
      res.write(JSON.stringify(startChunk) + '\n');

      // Generate contextual response based on conversation
      const response = await this.generateContextualResponse(processedMessages);

      // Tokenize the response for realistic streaming
      const tokens = this.tokenizeResponse(response);
      const startTime = new Date();

      // Initial thinking delay (like real AI processing)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      let currentContent = '';

      // Send metadata chunk with generation info
      const metadataChunk = {
        chunkType: 'metadata',
        data: {
          totalTokens: tokens.length,
          estimatedDuration: tokens.length * 50, // rough estimate in ms
          contentType: 'text/markdown',
          language: 'en',
          responseType: this.getResponseType(lastMessage.content)
        },
        timestamp: new Date().toISOString(),
        sessionId
      };
      res.write(JSON.stringify(metadataChunk) + '\n');

      // Stream tokens one by one
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const isLast = i === tokens.length - 1;

        currentContent += token;

        // Create token chunk with structured data
        const tokenChunk = {
          chunkType: 'token',
          data: {
            token,
            index: i + 1,
            totalTokens: tokens.length,
            progress: Math.round(((i + 1) / tokens.length) * 100),
            cumulativeContent: currentContent,
            tokenType: this.getTokenType(token),
            confidence: 0.92 + Math.random() * 0.07,
            isLastToken: isLast
          },
          timestamp: new Date().toISOString(),
          sessionId
        };

        // Send token chunk
        res.write(JSON.stringify(tokenChunk) + '\n');

        // Send periodic progress metadata (every 10 tokens)
        if (i > 0 && i % 10 === 0 && !isLast) {
          const progressChunk = {
            chunkType: 'progress',
            data: {
              progress: Math.round(((i + 1) / tokens.length) * 100),
              tokensProcessed: i + 1,
              tokensRemaining: tokens.length - i - 1,
              processingTimeMs: Date.now() - startTime.getTime(),
              estimatedRemainingMs: Math.round((tokens.length - i - 1) * 50),
              averageTokenTime: Math.round((Date.now() - startTime.getTime()) / (i + 1))
            },
            timestamp: new Date().toISOString(),
            sessionId
          };
          res.write(JSON.stringify(progressChunk) + '\n');
        }

        // Realistic streaming delays based on token type
        if (!isLast) {
          const delay = this.calculateStreamingDelay(token, i, tokens);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Send completion chunk
      const completeChunk = {
        chunkType: 'complete',
        data: {
          message: 'Response generation completed successfully',
          totalTokens: tokens.length,
          totalProcessingTimeMs: Date.now() - startTime.getTime(),
          finalContent: currentContent,
          averageTokenTime: Math.round((Date.now() - startTime.getTime()) / tokens.length),
          usage: {
            promptTokens: this.countTokens(processedMessages),
            completionTokens: tokens.length,
            totalTokens: this.countTokens(processedMessages) + tokens.length
          },
          quality: {
            confidence: 0.95,
            coherence: 0.92,
            relevance: 0.96
          }
        },
        timestamp: new Date().toISOString(),
        sessionId
      };
      res.write(JSON.stringify(completeChunk) + '\n');

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);

      // Send error chunk
      const errorChunk = {
        chunkType: 'error',
        data: {
          error: {
            message: 'An error occurred while generating the response',
            code: 'GENERATION_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            recoverable: true
          }
        },
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'unknown'
      };

      res.write(JSON.stringify(errorChunk) + '\n');
      res.end();
    }
  }

  /**
   * Generate contextual response based on conversation history - enhanced with better context awareness
   */
  private async generateContextualResponse(messages: ChatMessage[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();
    const conversationContext = messages.slice(-5); // More context for better responses

    // Enhanced conversation analysis
    const hasCodeContext = conversationContext.some(m =>
      m.content.includes('```') ||
      m.content.toLowerCase().includes('code') ||
      m.content.toLowerCase().includes('function') ||
      m.content.toLowerCase().includes('typescript') ||
      m.content.toLowerCase().includes('javascript') ||
      m.content.toLowerCase().includes('react') ||
      m.content.toLowerCase().includes('nestjs')
    );

    const hasProjectContext = conversationContext.some(m =>
      m.content.toLowerCase().includes('nx') ||
      m.content.toLowerCase().includes('monorepo') ||
      m.content.toLowerCase().includes('project') ||
      m.content.toLowerCase().includes('setup')
    );

    const isFollowUp = messages.length > 1;
    const isGreeting = userContent.match(/\b(hello|hi|hey|good morning|good afternoon|start|begin)\b/);
    const isQuestion = userContent.includes('?') || userContent.match(/\b(what|how|why|when|where|can|could|would|should)\b/);
    const isProblemSolving = userContent.match(/\b(error|issue|problem|bug|fix|help|stuck|trouble)\b/);
    const isCompliment = userContent.match(/\b(good|great|nice|excellent|perfect|awesome|thanks|thank you)\b/);

    // Smart response selection based on enhanced context
    if (isGreeting && !isFollowUp) {
      return this.getGreetingResponse();
    } else if (isCompliment) {
      return this.getComplimentResponse();
    } else if (isProblemSolving) {
      return this.getProblemSolvingResponse(userContent);
    } else if (hasCodeContext || userContent.includes('code')) {
      return this.getCodeResponse(userContent);
    } else if (hasProjectContext || userContent.includes('nx') || userContent.includes('monorepo')) {
      return this.getProjectResponse(userContent);
    } else if (userContent.includes('help') || userContent.includes('how')) {
      return this.getHelpResponse(userContent);
    } else if (userContent.includes('explain') || userContent.includes('what is')) {
      return this.getExplanationResponse(userContent);
    } else if (isQuestion) {
      return this.getQuestionResponse(userContent);
    } else if (isFollowUp) {
      return this.getFollowUpResponse(userContent, conversationContext);
    } else {
      return this.getGeneralResponse(userContent);
    }
  }

  /**
   * Tokenize response for realistic streaming - improved for more natural flow
   */
  private tokenizeResponse(text: string): string[] {
    const tokens: string[] = [];

    // Split by natural boundaries while preserving formatting
    const parts = text.split(/(\s+|[\n\r]+|[.,!?;:]|```|`|\*\*|\*|##|#|\|)/);

    for (const part of parts) {
      if (part.trim()) {
        // Handle different token types for more natural streaming
        if (part.startsWith('```')) {
          // Code blocks stream as complete units
          tokens.push(part);
        } else if (part.match(/^\*\*.*\*\*$/)) {
          // Bold text streams as units
          tokens.push(part);
        } else if (part.length > 12 && Math.random() > 0.8) {
          // Occasionally split very long words for realism
          const chunks = Math.ceil(part.length / 8);
          for (let i = 0; i < chunks; i++) {
            const start = i * 8;
            const end = Math.min(start + 8, part.length);
            tokens.push(part.slice(start, end));
          }
        } else {
          tokens.push(part);
        }
      } else if (part.includes('\n')) {
        // Preserve line breaks
        tokens.push(part);
      } else if (part.trim() === '') {
        // Preserve spaces
        tokens.push(part);
      }
    }

    return tokens.filter(token => token.length > 0);
  }

  /**
   * Calculate realistic streaming delay based on token content - enhanced for better timing
   */
  private calculateStreamingDelay(token: string, index: number, allTokens: string[]): number {
    const baseDelay = 15; // Faster base delay for more responsive feel
    const randomFactor = Math.random() * 25; // Add randomness

    let delay = baseDelay + randomFactor;

    // Different delays based on content type
    if (/[.!?]$/.test(token)) {
      delay += 200 + Math.random() * 300; // Longer pause after sentences
    } else if (/[,;:]$/.test(token)) {
      delay += 80 + Math.random() * 120; // Medium pause for commas
    } else if (token.includes('\n\n')) {
      delay += 300 + Math.random() * 400; // Long pause for paragraph breaks
    } else if (token.includes('\n')) {
      delay += 150 + Math.random() * 200; // Medium pause for line breaks
    } else if (token.startsWith('```')) {
      delay += 400 + Math.random() * 600; // Processing code blocks
    } else if (token.startsWith('#')) {
      delay += 200 + Math.random() * 300; // Headers need processing time
    } else if (token.includes('**')) {
      delay += 50 + Math.random() * 100; // Bold text formatting
    } else if (token.includes('`')) {
      delay += 30 + Math.random() * 70; // Inline code
    } else if (token.length > 8) {
      delay += token.length * 3; // Longer words take proportionally more time
    } else if (/^\d+\./.test(token)) {
      delay += 100 + Math.random() * 150; // List items
    }

    // Dynamic speed adjustment based on position
    const progressRatio = index / allTokens.length;

    if (progressRatio < 0.1) {
      // Slower start (thinking time)
      delay *= 1.5;
    } else if (progressRatio < 0.3) {
      // Getting into rhythm
      delay *= 1.2;
    } else if (progressRatio > 0.8) {
      // Slightly slower towards end (wrapping up thoughts)
      delay *= 1.1;
    }

    // Add some variety to prevent mechanical feeling
    if (Math.random() < 0.1) {
      delay *= 0.5; // Occasional quick bursts
    } else if (Math.random() < 0.05) {
      delay *= 2; // Occasional pauses for "thinking"
    }

    return Math.round(Math.max(10, delay)); // Minimum 10ms delay
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

  /**
   * Determine the type of token for better streaming visualization
   */
  private getTokenType(token: string): string {
    if (token.startsWith('```')) return 'code_block';
    if (token.startsWith('**') && token.endsWith('**')) return 'bold';
    if (token.startsWith('#')) return 'header';
    if (token.match(/^[-*+]\s/)) return 'list_item';
    if (token.match(/[.!?]+$/)) return 'sentence_end';
    if (token.match(/[,;:]+$/)) return 'punctuation';
    if (token.match(/^\n+$/)) return 'line_break';
    if (token.trim().length === 0) return 'whitespace';
    if (token.match(/^\d+$/)) return 'number';
    if (token.match(/^[A-Z][a-z]+$/)) return 'capitalized_word';
    return 'word';
  }

  /**
   * Determine the type of response being generated
   */
  private getResponseType(userContent: string): string {
    const content = userContent.toLowerCase();

    if (content.includes('code') || content.includes('function') || content.includes('programming')) {
      return 'code_explanation';
    }
    if (content.includes('explain') || content.includes('what is') || content.includes('how does')) {
      return 'explanation';
    }
    if (content.includes('write') || content.includes('create') || content.includes('story')) {
      return 'creative';
    }
    if (content.includes('help') || content.includes('problem') || content.includes('issue')) {
      return 'assistance';
    }
    if (content.includes('?')) {
      return 'question_answer';
    }

    return 'general_conversation';
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

  private getComplimentResponse(): string {
    const responses = [
      `Thank you! I'm glad I could help. 😊 

This project is designed to showcase how modern web technologies can work together seamlessly:

- **Frontend**: React with Material-UI for a polished interface
- **Backend**: NestJS providing robust API endpoints
- **Development**: Nx monorepo for efficient development workflow
- **Streaming**: Real-time communication with Server-Sent Events

Is there anything else you'd like to explore or any other questions I can help with?`,

      `I appreciate your kind words! 🙏

It's great to see the streaming functionality working smoothly. The combination of:
- Token-by-token streaming
- Contextual responses  
- Markdown rendering
- Responsive design

...creates a nice ChatGPT-like experience. Feel free to test out different types of questions - I can help with code examples, explanations, problem-solving, and more!`,

      `Thanks! That means a lot. ✨

This demo showcases several interesting technical concepts:
- **Real-time streaming** with controlled delays for natural flow
- **Context awareness** based on conversation history
- **Rich formatting** with markdown support
- **Modern architecture** using TypeScript throughout

What would you like to explore next?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getProblemSolvingResponse(userContent: string): string {
    const responses = [
      `I'm here to help you troubleshoot! 🔧 Let's work through this step by step.

Common debugging approaches:

1. **Identify the Problem**: What exactly is happening vs. what you expected?
2. **Check the Basics**: 
   - Are all services running?
   - Are there any console errors?
   - Is the network connection working?
3. **Isolate the Issue**: Test components individually
4. **Review Recent Changes**: What was the last thing that worked?

For this **Nx monorepo** specifically, common issues include:
- Port conflicts between frontend/backend
- CORS configuration problems
- Build/serve command issues
- Missing dependencies

What specific error or issue are you encountering?`,

      `Let's solve this together! 🚀

Here's my **systematic debugging checklist**:

**Frontend Issues:**
- Check browser console for errors
- Verify API endpoints are correct
- Test with browser dev tools network tab

**Backend Issues:**
- Check server logs
- Verify database connections
- Test endpoints with Postman/curl

**Nx Workspace Issues:**
- Run \`nx reset\` to clear cache
- Check \`nx.json\` configuration
- Verify project dependencies

**Common Quick Fixes:**
\`\`\`bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Nx cache
nx reset

# Check if ports are available
lsof -i :3000
lsof -i :4200
\`\`\`

What's the specific issue you're facing?`
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

  private getProjectResponse(userContent: string): string {
    const responses = [
      `Great question about the **Nx monorepo setup**! 📁

This project structure demonstrates several best practices:

## **Project Architecture:**
\`\`\`
iagent/
├── apps/
│   ├── backend/     # NestJS API server
│   └── frontend/    # React application
├── libs/            # Shared libraries
└── tools/           # Development tools
\`\`\`

## **Key Benefits:**
- **Code Sharing**: Common utilities, types, and components
- **Unified Tooling**: Single place for linting, testing, building
- **Dependency Management**: Consistent versions across apps
- **Development Efficiency**: Fast rebuilds with intelligent caching

## **Available Commands:**
\`\`\`bash
# Development
nx serve backend    # Start API server (port 3000)
nx serve frontend   # Start React app (port 4200)

# Building
nx build backend
nx build frontend

# Testing
nx test backend
nx test frontend
\`\`\`

What aspect of the Nx setup interests you most?`,

      'Excellent! You\'re asking about the **monorepo architecture**. 🏗️\n\n' +
      'This setup showcases how to organize a **full-stack TypeScript application**:\n\n' +
      '### **Backend (NestJS):**\n' +
      '- RESTful API with /api prefix\n' +
      '- Server-Sent Events for streaming\n' +
      '- Swagger documentation at /api/docs\n' +
      '- CORS enabled for frontend communication\n\n' +
      '### **Frontend (React):**\n' +
      '- Modern React 19 with hooks\n' +
      '- Material-UI components\n' +
      '- Real-time streaming integration\n' +
      '- Responsive ChatGPT-like interface\n\n' +
      '### **Development Workflow:**\n' +
      '1. **Start both apps**: nx run-many --target=serve --projects=backend,frontend\n' +
      '2. **Parallel development**: Changes auto-reload\n' +
      '3. **Shared types**: Type safety across frontend/backend\n' +
      '4. **Consistent tooling**: Same ESLint, Prettier, Jest config\n\n' +
      '### **Production Ready:**\n' +
      '- Built with nx build for optimized bundles\n' +
      '- Environment-specific configurations\n' +
      '- Docker-ready setup\n\n' +
      'Want to know more about any specific part?'
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

  private getQuestionResponse(userContent: string): string {
    const responses = [
      'That\'s a thoughtful question! 🤔 Let me provide a comprehensive answer:\n\n' +
      'The approach depends on what you\'re trying to accomplish. In general, I recommend:\n\n' +
      '**For Learning:**\n' +
      '- Start with the fundamentals\n' +
      '- Practice with small projects\n' +
      '- Build up complexity gradually\n' +
      '- Learn from real-world examples (like this project!)\n\n' +
      '**For Problem Solving:**\n' +
      '- Break the problem into smaller parts\n' +
      '- Research existing solutions\n' +
      '- Prototype quickly\n' +
      '- Iterate based on feedback\n\n' +
      '**For This Demo Specifically:**\n' +
      '- Explore the codebase structure\n' +
      '- Test different input types\n' +
      '- Check out the Swagger docs at /api/docs\n' +
      '- Try the streaming functionality\n\n' +
      'What specific aspect would you like me to elaborate on?',

      'Interesting question! 💭 Here\'s how I\'d approach it:\n\n' +
      '**Context Matters:** The best solution depends on:\n' +
      '- Your specific use case\n' +
      '- Available resources and constraints\n' +
      '- Timeline and complexity requirements\n' +
      '- Team expertise and preferences\n\n' +
      '**For Web Development Projects:**\n' +
      '1. **Choose the right stack** (like React + NestJS here)\n' +
      '2. **Plan your architecture** (monorepo vs separate repos)\n' +
      '3. **Set up good development practices** (linting, testing, CI/CD)\n' +
      '4. **Focus on user experience** (responsive design, performance)\n\n' +
      '**For This Type of Chat Application:**\n' +
      '- **Real-time communication** (WebSockets or SSE)\n' +
      '- **State management** (context, reducers, or external libraries)\n' +
      '- **Error handling** (graceful degradation)\n' +
      '- **Accessibility** (keyboard navigation, screen readers)\n\n' +
      'Would you like me to dive deeper into any of these areas?'
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

}
