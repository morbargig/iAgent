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
  ToolSelectionDto,
  ChatMessageDto
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
    try {
      const { chatId, auth, messages, tools, requestTimestamp } = request;

      // Validate required fields
      if (!auth || !auth.userId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Authentication required',
          message: 'Missing or invalid auth object with userId'
        });
        return;
      }

      if (!chatId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Missing chatId',
          message: 'chatId is required'
        });
        return;
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid messages',
          message: 'messages array is required and must not be empty'
        });
        return;
      }

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

      const promptTokenCount = this.countTokens(processedMessages);

      const chatName = this.deriveChatName(messages);
      try {
        await this.chatService.ensureChatExists({
          chatId,
          userId: auth.userId,
          name: chatName
        });
      } catch (ensureError) {
        console.error('Failed to ensure chat exists:', ensureError);
        // Continue anyway - chat might already exist or we'll handle it later
        // Don't fail the entire request if chat creation fails
      }

      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }

      const lastUserMessageDto = lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : undefined;
      const lastUserMessage = lastUserMessageIndex >= 0 ? processedMessages[lastUserMessageIndex] : undefined;
      const assistantPlaceholderDto = messages[messages.length - 1];
      const lastUserContent = lastUserMessage?.content || '';

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save user message with filter data if it's a user message
      if (lastUserMessage && lastUserMessageDto) {
        try {
          let filterId = null;
          let filterSnapshot = null;

          if (lastUserMessageDto.filterId && lastUserMessageDto.filterSnapshot) {
            // Create/save the filter for this chat
            const filterData = {
              filterId: lastUserMessageDto.filterId,
              name: lastUserMessageDto.filterSnapshot.name || 'Unnamed Filter',
              filterConfig: lastUserMessageDto.filterSnapshot.config || {},
              chatId,
              userId: auth.userId
            };

            try {
              const savedFilter = await this.chatService.createFilter(filterData);
              filterId = savedFilter.filterId;
            } catch (filterError) {
              if ((filterError as { code?: number }).code !== 11000) {
                throw filterError;
              }
              filterId = filterData.filterId;
            }

            filterSnapshot = lastUserMessageDto.filterSnapshot;

            // Set as active filter for the chat
            await this.chatService.setActiveFilter(chatId, auth.userId, filterId);

            console.log('💾 Filter saved and set as active:', filterId);
          }

          // Save the user message with filter information
          await this.chatService.addMessage({
            id: lastUserMessage.id,
            chatId,
            userId: auth.userId,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
            timestamp: lastUserMessage.timestamp,
            metadata: {
              requestTimestamp: requestTimestamp || new Date().toISOString(),
              tools: tools || []
            },
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
            promptTokens: promptTokenCount,
            categories: this.categorizeContent(lastUserContent),
            conversationLength: processedMessages.length
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(startChunk) + '\n');

        // Detect tools from request
        const hasToolT = tools && Array.isArray(tools) && tools.some((t: any) => t?.id === 'tool-t' || t?.name === 'tool-t');
        const hasToolX = tools && Array.isArray(tools) && tools.some((t: any) => t?.id === 'tool-x' || t?.name === 'tool-x');
        
        // Determine if we should generate tool sections (30% chance or if tools are explicitly requested)
        const shouldGenerateToolSections = (hasToolT || hasToolX) || Math.random() < 0.3;

        const startTime = new Date();
        let totalTokens = 0;
        let currentContent = '';
        let toolTTokens: string[] = [];
        let toolXTokens: string[] = [];

        // Send metadata chunk with generation info
        const metadataChunk = {
          chunkType: 'metadata',
          data: {
            totalTokens: 0, // Will be updated
            estimatedDuration: 0,
            contentType: 'text/markdown',
            language: 'en',
            responseType: this.getResponseType(lastUserContent)
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(metadataChunk) + '\n');

        // Stream tool sections if applicable
        if (shouldGenerateToolSections) {
          // Stream tool-t section if applicable
          if (hasToolT || Math.random() < 0.5) {
            const toolTContent = this.generateToolTSection();
            toolTTokens = this.tokenizeResponse(toolTContent);
            totalTokens += toolTTokens.length;

            // Send tool-t section start
            const toolTSectionStart = {
              chunkType: 'section',
              data: {
                section: 'tool-t',
                contentType: 'markdown',
                action: 'start'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolTSectionStart) + '\n');

            // Stream tool-t tokens
            let toolTContentAccumulator = '';
            for (let i = 0; i < toolTTokens.length; i++) {
              const token = toolTTokens[i];
              toolTContentAccumulator += token;
              currentContent += token;

              const tokenChunk = {
                chunkType: 'token',
                data: {
                  token,
                  index: i + 1,
                  totalTokens: 0, // Will be updated later
                  progress: 0,
                  cumulativeContent: currentContent,
                  tokenType: this.getTokenType(token),
                  confidence: 0.92 + Math.random() * 0.07,
                  isLastToken: false,
                  section: 'tool-t',
                  contentType: this.detectContentType(token, toolTContentAccumulator)
                },
                timestamp: new Date().toISOString(),
                sessionId
              };
              res.write(JSON.stringify(tokenChunk) + '\n');

              if (i < toolTTokens.length - 1) {
                const delay = this.calculateStreamingDelay(token, i, toolTTokens);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            // Send tool-t section end
            const toolTSectionEnd = {
              chunkType: 'section',
              data: {
                section: 'tool-t',
                contentType: 'markdown',
                action: 'end'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolTSectionEnd) + '\n');
          }

          // Stream tool-x section if applicable
          if (hasToolX || Math.random() < 0.5) {
            const toolXContent = this.generateToolXSection();
            toolXTokens = this.tokenizeResponse(toolXContent);
            totalTokens += toolXTokens.length;

            // Send tool-x section start
            const toolXSectionStart = {
              chunkType: 'section',
              data: {
                section: 'tool-x',
                contentType: 'markdown',
                action: 'start'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolXSectionStart) + '\n');

            // Stream tool-x tokens
            let toolXContentAccumulator = '';
            for (let i = 0; i < toolXTokens.length; i++) {
              const token = toolXTokens[i];
              toolXContentAccumulator += token;
              currentContent += token;

              const tokenChunk = {
                chunkType: 'token',
                data: {
                  token,
                  index: toolTTokens.length + i + 1,
                  totalTokens: 0,
                  progress: 0,
                  cumulativeContent: currentContent,
                  tokenType: this.getTokenType(token),
                  confidence: 0.92 + Math.random() * 0.07,
                  isLastToken: false,
                  section: 'tool-x',
                  contentType: this.detectContentType(token, toolXContentAccumulator)
                },
                timestamp: new Date().toISOString(),
                sessionId
              };
              res.write(JSON.stringify(tokenChunk) + '\n');

              if (i < toolXTokens.length - 1) {
                const delay = this.calculateStreamingDelay(token, i, toolXTokens);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            // Send tool-x section end
            const toolXSectionEnd = {
              chunkType: 'section',
              data: {
                section: 'tool-x',
                contentType: 'markdown',
                action: 'end'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolXSectionEnd) + '\n');
          }
        }

        // Generate contextual response based on conversation
        const response = await this.generateContextualResponse(processedMessages);

        // Tokenize the response for realistic streaming
        const answerTokens = this.tokenizeResponse(response);
        totalTokens += answerTokens.length;

        // Initial thinking delay (like real AI processing)
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

        // Send section start for answer section
        const answerSectionStart = {
          chunkType: 'section',
          data: {
            section: 'answer',
            contentType: 'markdown',
            action: 'start'
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(answerSectionStart) + '\n');

        // Stream tokens one by one
        for (let i = 0; i < answerTokens.length; i++) {
          const token = answerTokens[i];
          const isLast = i === answerTokens.length - 1;

          currentContent += token;

          // Create token chunk with structured data
          const tokenChunk = {
            chunkType: 'token',
            data: {
              token,
              index: toolTTokens.length + toolXTokens.length + i + 1,
              totalTokens: totalTokens,
              progress: Math.round(((toolTTokens.length + toolXTokens.length + i + 1) / totalTokens) * 100),
              cumulativeContent: currentContent,
              tokenType: this.getTokenType(token),
              confidence: 0.92 + Math.random() * 0.07,
              isLastToken: isLast,
              section: 'answer',
              contentType: 'markdown'
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
                progress: Math.round(((toolTTokens.length + toolXTokens.length + i + 1) / totalTokens) * 100),
                tokensProcessed: toolTTokens.length + toolXTokens.length + i + 1,
                tokensRemaining: answerTokens.length - i - 1,
                processingTimeMs: Date.now() - startTime.getTime(),
                estimatedRemainingMs: Math.round((answerTokens.length - i - 1) * 50),
                averageTokenTime: Math.round((Date.now() - startTime.getTime()) / (toolTTokens.length + toolXTokens.length + i + 1))
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(progressChunk) + '\n');
          }

          // Realistic streaming delays based on token type
          if (!isLast) {
            const delay = this.calculateStreamingDelay(token, i, answerTokens);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Send completion chunk
        try {
          if (assistantPlaceholderDto?.role === 'assistant') {
            await this.chatService.addMessage({
              id: assistantPlaceholderDto.id,
              chatId,
              userId: auth.userId,
              role: 'assistant',
              content: currentContent,
              timestamp: new Date(),
              metadata: {
                sessionId,
                model: 'chatgpt-clone-v1',
                usage: {
                  promptTokens: promptTokenCount,
                  completionTokens: totalTokens,
                  totalTokens: promptTokenCount + totalTokens,
                },
                responseType: this.getResponseType(lastUserContent),
              },
              filterId: assistantPlaceholderDto.filterId || lastUserMessageDto?.filterId || null,
              filterSnapshot: assistantPlaceholderDto.filterSnapshot || lastUserMessageDto?.filterSnapshot,
            });

            console.log('🤖 Assistant message saved to chat history');
          }
        } catch (saveError) {
          console.error('Failed to save assistant message:', saveError);
        }

        // Send section end for answer section
        const answerSectionEnd = {
          chunkType: 'section',
          data: {
            section: 'answer',
            contentType: 'markdown',
            action: 'end'
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(answerSectionEnd) + '\n');

        const completeChunk = {
          chunkType: 'complete',
          data: {
            message: 'Response generation completed successfully',
            totalTokens: totalTokens,
            totalProcessingTimeMs: Date.now() - startTime.getTime(),
            finalContent: currentContent,
            averageTokenTime: Math.round((Date.now() - startTime.getTime()) / totalTokens),
            usage: {
              promptTokens: promptTokenCount,
              completionTokens: totalTokens,
              totalTokens: promptTokenCount + totalTokens
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
      } catch (innerError) {
        console.error('Streaming error:', innerError);
        console.error('Error stack:', innerError instanceof Error ? innerError.stack : 'No stack trace');

        // Send error chunk if response hasn't been sent yet
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }

        const errorChunk = {
          chunkType: 'error',
          data: {
            error: {
              message: 'An error occurred while generating the response',
              code: 'GENERATION_ERROR',
              details: innerError instanceof Error ? innerError.message : 'Unknown error',
              timestamp: new Date().toISOString(),
              recoverable: true
            }
          },
          timestamp: new Date().toISOString(),
          sessionId: sessionId || 'unknown'
        };

        try {
          res.write(JSON.stringify(errorChunk) + '\n');
          res.end();
        } catch (writeError) {
          console.error('Failed to write error chunk:', writeError);
          try {
            res.end();
          } catch (endError) {
            console.error('Failed to end response:', endError);
          }
        }
      }
    } catch (outerError: unknown) {
      console.error('Outer error in streamChat:', outerError);
      console.error('Error stack:', outerError instanceof Error ? outerError.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Internal server error',
          message: outerError instanceof Error ? outerError.message : 'Unknown error occurred'
        });
      } else {
        try {
          const errorChunk = {
            chunkType: 'error',
            data: {
              error: {
                message: 'An error occurred while processing the request',
                code: 'REQUEST_ERROR',
                details: outerError instanceof Error ? outerError.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                recoverable: false
              }
            },
            timestamp: new Date().toISOString(),
            sessionId: 'unknown'
          };
          res.write(JSON.stringify(errorChunk) + '\n');
          res.end();
        } catch (endError) {
          console.error('Failed to end response after outer error:', endError);
        }
      }
    }
  }

  /**
   * Generate contextual response based on conversation history - enhanced with better context awareness
   */
  private async generateContextualResponse(messages: ChatMessage[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();
    const conversationContext = messages.slice(-5); // More context for better responses

    // 30% chance to include demo content
    const shouldIncludeDemo = Math.random() < 0.3;
    if (shouldIncludeDemo) {
      const demoType = Math.floor(Math.random() * 4);
      switch (demoType) {
        case 0:
          return this.getDemoTableResponse();
        case 1:
          return this.getDemoCitationResponse();
        case 2:
          return this.getDemoReportResponse();
        case 3:
          return this.getDemoMixedResponse();
      }
    }

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
      if (!part) continue; // Skip empty parts
      
      // Preserve spaces and newlines
      if (part.match(/^\s+$/) || part.includes('\n') || part.includes('\r')) {
        tokens.push(part);
        continue;
      }
      
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

  private deriveChatName(messages: ChatMessageDto[]): string {
    const firstUserMessage = messages.find((msg) => msg.role === 'user' && msg.content?.trim().length);
    if (!firstUserMessage) {
      return 'New Chat';
    }

    const normalized = firstUserMessage.content.trim().replace(/\s+/g, ' ');
    if (normalized.length <= 60) {
      return normalized;
    }

    return `${normalized.slice(0, 57)}...`;
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
    // Extract actual conversation topics and content
    const previousMessages = context.slice(0, -1); // All except the last one
    const previousUserMessages = previousMessages.filter(m => m.role === 'user');
    const previousAssistantMessages = previousMessages.filter(m => m.role === 'assistant');
    
    // Extract key topics from conversation history
    const topics: string[] = [];
    const codeBlocks: string[] = [];
    const questions: string[] = [];
    
    previousMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Extract code-related topics
      if (content.includes('typescript') || content.includes('javascript')) {
        topics.push('TypeScript/JavaScript');
      }
      if (content.includes('react')) {
        topics.push('React');
      }
      if (content.includes('nestjs')) {
        topics.push('NestJS');
      }
      if (content.includes('stream') || content.includes('chunk')) {
        topics.push('streaming');
      }
      if (content.includes('code') || content.includes('function')) {
        topics.push('programming');
      }
      
      // Extract code blocks
      const codeMatch = msg.content.match(/```[\s\S]*?```/g);
      if (codeMatch) {
        codeBlocks.push(...codeMatch);
      }
      
      // Extract questions
      if (msg.role === 'user' && msg.content.includes('?')) {
        questions.push(msg.content.substring(0, 100));
      }
    });
    
    const uniqueTopics = [...new Set(topics)];
    const lastUserMessage = previousUserMessages[previousUserMessages.length - 1];
    const lastAssistantMessage = previousAssistantMessages[previousAssistantMessages.length - 1];
    
    // Build contextual response based on actual conversation
    let response = '';
    
    if (uniqueTopics.length > 0) {
      response += `Continuing our discussion about ${uniqueTopics.join(', ')}, `;
    } else {
      response += `Building on what we've been discussing, `;
    }
    
    // Reference the last user message if available
    if (lastUserMessage) {
      const lastUserContent = lastUserMessage.content.substring(0, 150);
      if (lastUserContent.length > 0) {
        response += `you mentioned: "${lastUserContent}${lastUserContent.length >= 150 ? '...' : ''}"\n\n`;
      }
    }
    
    // Reference the last assistant response if available
    if (lastAssistantMessage) {
      const lastAssistantContent = lastAssistantMessage.content.substring(0, 200);
      if (lastAssistantContent.length > 0) {
        response += `In my previous response, I covered: ${lastAssistantContent.substring(0, 100)}${lastAssistantContent.length >= 100 ? '...' : ''}\n\n`;
      }
    }
    
    // Analyze current user message for specific follow-up
    const lowerContent = userContent.toLowerCase();
    
    if (lowerContent.includes('more') || lowerContent.includes('expand') || lowerContent.includes('detail')) {
      response += `Let me provide more details:\n\n`;
      
      if (codeBlocks.length > 0) {
        response += `**Code Examples:**\n`;
        response += `Here's an enhanced version of the code we discussed:\n\n`;
        response += `\`\`\`typescript\n`;
        response += `// Enhanced implementation based on our discussion\n`;
        response += `// This builds on the previous examples\n`;
        response += `\`\`\`\n\n`;
      }
      
      if (uniqueTopics.includes('streaming')) {
        response += `**Streaming Implementation:**\n`;
        response += `For the streaming functionality we discussed, here are key considerations:\n`;
        response += `- Token-by-token processing for smooth UX\n`;
        response += `- Proper error handling and recovery\n`;
        response += `- State management during streaming\n\n`;
      }
    } else if (lowerContent.includes('how') || lowerContent.includes('implement')) {
      response += `Here's how to implement this:\n\n`;
      response += `**Step-by-Step Approach:**\n`;
      response += `1. Start with the core functionality\n`;
      response += `2. Add error handling and edge cases\n`;
      response += `3. Optimize for performance\n`;
      response += `4. Test thoroughly\n\n`;
    } else if (lowerContent.includes('why') || lowerContent.includes('reason')) {
      response += `Here's the reasoning behind this approach:\n\n`;
      response += `**Why This Works:**\n`;
      response += `- It addresses the specific requirements we discussed\n`;
      response += `- It follows best practices for maintainability\n`;
      response += `- It scales well with your use case\n\n`;
    } else if (lowerContent.includes('example') || lowerContent.includes('show')) {
      response += `Here's a practical example:\n\n`;
      
      if (uniqueTopics.includes('programming') || uniqueTopics.includes('TypeScript/JavaScript')) {
        response += `\`\`\`typescript\n`;
        response += `// Example implementation\n`;
        response += `function example() {\n`;
        response += `  // Based on our conversation\n`;
        response += `  return 'implementation';\n`;
        response += `}\n`;
        response += `\`\`\`\n\n`;
      }
    } else {
      // Generic but contextual follow-up
      response += `Let me address your question:\n\n`;
      
      if (uniqueTopics.length > 0) {
        response += `**Regarding ${uniqueTopics[0]}:**\n`;
        response += `Based on our previous discussion, here are some additional insights:\n\n`;
      }
      
      response += `**Key Points:**\n`;
      response += `- This relates to what we covered earlier\n`;
      response += `- There are practical considerations to keep in mind\n`;
      response += `- The implementation can be tailored to your needs\n\n`;
    }
    
    response += `**Next Steps:**\n`;
    response += `Would you like me to:\n`;
    response += `- Provide more specific code examples?\n`;
    response += `- Explain any particular aspect in more detail?\n`;
    response += `- Help with implementation?\n\n`;
    response += `What would be most helpful?`;
    
    return response;
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

  /**
   * Generate content for tool-t section with tables and citations
   */
  private generateToolTSection(): string {
    const contentTypes = ['table', 'citation', 'table'];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    if (selectedType === 'table') {
      return `## Tool T Analysis Results

Here's a detailed comparison table from Tool T:

table: Tool T Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Response Time | 120ms | <150ms | ✅ Pass |
| Throughput | 850 req/s | >800 req/s | ✅ Pass |
| Error Rate | 0.2% | <1% | ✅ Pass |
| CPU Usage | 45% | <60% | ✅ Pass |

### Key Findings

> "Tool T demonstrates excellent performance characteristics with all metrics meeting or exceeding targets. The response time is particularly impressive given the complexity of operations."

This analysis shows Tool T is performing well across all measured dimensions.`;
    } else if (selectedType === 'citation') {
      return `## Tool T Research Summary

> "Tool T leverages advanced algorithms to optimize processing efficiency. The implementation follows industry best practices for scalability and reliability."

### Analysis Details

Based on extensive testing, Tool T shows:

- **Efficiency**: 95% improvement over baseline
- **Reliability**: 99.8% uptime
- **Scalability**: Handles 10x load increase

> "The results demonstrate Tool T's capability to handle production workloads effectively while maintaining high quality standards."

These findings support the recommendation to deploy Tool T in production environments.`;
    }

    return `## Tool T Results

Tool T has completed its analysis. Here are the findings:

table: Tool T Summary

| Category | Count | Status |
|----------|-------|--------|
| Processed | 1,234 | Complete |
| Errors | 2 | Resolved |
| Warnings | 5 | Reviewed |

> "Tool T successfully processed all items with minimal issues. The error rate is well within acceptable limits."

The analysis is complete and ready for review.`;
  }

  /**
   * Generate content for tool-x section with tables and citations
   */
  private generateToolXSection(): string {
    const contentTypes = ['table', 'citation', 'report'];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    if (selectedType === 'table') {
      return `## Tool X Execution Report

Tool X has generated the following analysis:

table: Tool X Data Analysis

| Dataset | Records | Processed | Quality Score |
|---------|---------|-----------|---------------|
| Dataset A | 5,432 | 5,430 | 98.5% |
| Dataset B | 3,210 | 3,208 | 97.2% |
| Dataset C | 8,765 | 8,763 | 99.1% |

### Summary

> "Tool X processed all datasets successfully with high quality scores. The processing pipeline demonstrates robust error handling and data validation."

All datasets have been processed and validated.`;
    } else if (selectedType === 'citation') {
      return `## Tool X Research Findings

> "Tool X implements a sophisticated data processing pipeline that ensures high accuracy and reliability. The architecture supports concurrent processing of multiple datasets."

### Performance Metrics

- **Processing Speed**: 2.5x faster than previous version
- **Accuracy**: 99.2% across all test cases
- **Resource Usage**: 30% reduction in memory consumption

> "These improvements make Tool X suitable for production deployment at scale. The reduced resource usage is particularly beneficial for cost optimization."

Tool X is ready for production use.`;
    } else {
      return `## Tool X Analysis Complete

Tool X has completed comprehensive analysis:

table: Tool X Results Summary

| Test Case | Result | Duration | Notes |
|-----------|--------|----------|-------|
| Unit Tests | ✅ Pass | 45s | All 234 tests passed |
| Integration | ✅ Pass | 2m 15s | No issues detected |
| Performance | ✅ Pass | 5m 30s | Within targets |

> "Tool X demonstrates excellent test coverage and performance characteristics. All test suites passed without issues."

The analysis confirms Tool X meets all quality requirements.`;
    }
  }

  /**
   * Detect content type from token and accumulated content
   */
  private detectContentType(token: string, accumulatedContent: string): 'table' | 'citation' | 'report' | 'markdown' {
    const lowerContent = accumulatedContent.toLowerCase();
    
    // Check for table markers
    if (lowerContent.includes('table:') || lowerContent.includes('|') && lowerContent.includes('---')) {
      return 'table';
    }
    
    // Check for citation markers (quote blocks)
    if (lowerContent.includes('>') && lowerContent.split('>').length > 2) {
      return 'citation';
    }
    
    // Check for report markers
    if (lowerContent.includes('report:') || lowerContent.includes('"reportid"')) {
      return 'report';
    }
    
    return 'markdown';
  }

  private getDemoTableResponse(): string {
    return `Here's a comparison table showing different approaches:

table: Performance Comparison

| Approach | Speed | Complexity | Maintainability |
|----------|-------|------------|-----------------|
| Option A | Fast | Low | High |
| Option B | Medium | Medium | Medium |
| Option C | Slow | High | Low |

This table helps visualize the trade-offs between different solutions.`;
  }

  private getDemoCitationResponse(): string {
    return `Here's an important citation (ציטוט):

> "The best code is code that you don't have to write. The second best is code that is easy to read and understand."

This principle guides modern software development practices.`;
  }

  private getDemoReportResponse(): string {
    return `Here's a detailed report:

report: {
  "id": "report-demo-001",
  "title": "System Performance Analysis",
  "summary": "Comprehensive analysis of system metrics and recommendations",
  "metadata": {
    "date": "2024-01-15",
    "category": "performance",
    "priority": "high"
  }
}

This report contains detailed insights and recommendations.`;
  }

  private getDemoMixedResponse(): string {
    return `Let me show you a comprehensive example with multiple content types:

## Analysis Results

Here's a citation (ציטוט) from a recent study:

> "Modern web applications require careful consideration of performance, maintainability, and user experience."

### Data Comparison

table: Feature Comparison

| Feature | Version 1 | Version 2 | Version 3 |
|---------|----------|-----------|-----------|
| Speed | 100ms | 80ms | 60ms |
| Memory | 50MB | 45MB | 40MB |
| Complexity | Low | Medium | High |

### Summary Report

report: {
  "id": "mixed-demo-001",
  "title": "Comprehensive Analysis",
  "summary": "Combined analysis with citations and tables",
  "metadata": {
    "type": "mixed",
    "sections": ["citation", "table", "report"]
  }
}

This demonstrates how different content types work together.`;
  }

}
