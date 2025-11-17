import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
import { environment } from '../environments/environment';
import {
  ChatRequestDto,
  ChatResponseDto,
  StreamTokenDto,
  ErrorResponseDto,
  HealthCheckDto,
  AuthTokenDto,
  ToolSelectionDto,
  ChatMessageDto,
  CountryDto,
  PermissionsDto,
  VersionDto
} from './dto/chat.dto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}


@ApiTags('Chat API')
@ApiExtraModels(ChatRequestDto, ChatResponseDto, StreamTokenDto, ErrorResponseDto, HealthCheckDto, AuthTokenDto, ToolSelectionDto, CountryDto, PermissionsDto, VersionDto)
@Controller()
export class AppController {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService
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
      version: environment.app.version,
      uptime: Math.floor(process.uptime()),
      endpoints: {
        health: '/api',
        login: '/api/auth/login',
        stream: '/api/chat/stream',
        docs: '/docs',
        version: '/api/version'
      }
    };
  }

  @Get('version')
  @ApiOperation({
    summary: 'Get application version',
    description: 'Returns the current application version information'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version information retrieved successfully',
    type: VersionDto,
    schema: {
      $ref: getSchemaPath(VersionDto)
    }
  })
  getVersion(): VersionDto {
    return {
      name: environment.app.name,
      version: environment.app.version,
      buildDate: process.env.BUILD_DATE || new Date().toISOString()
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

  @Get('auth/permissions')
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Returns permissions for the authenticated user based on their role'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully',
    type: PermissionsDto,
    schema: {
      $ref: getSchemaPath(PermissionsDto)
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required'
  })
  getPermissions(): PermissionsDto {
    return {
      userId: 'default',
      role: 'user',
      permissions: {
        canUseToolT: true,
        canUseToolH: true,
        canUseToolF: true,
        canViewReports: true,
        canManageFilters: true,
      },
    };
  }

  @Get('tools/pages')
  @ApiOperation({
    summary: 'Get page options for tools',
    description: 'Returns available page options for tool configuration'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page options retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', example: 'news' },
          label: { type: 'string', example: 'News Articles' }
        }
      }
    }
  })
  getPageOptions() {
    return [
      { value: 'news', label: 'News Articles' },
      { value: 'academic', label: 'Academic Papers' },
      { value: 'blogs', label: 'Blog Posts' },
      { value: 'forums', label: 'Discussion Forums' },
      { value: 'wiki', label: 'Wikipedia' },
      { value: 'government', label: 'Government Sites' },
      { value: 'social', label: 'Social Media' },
      { value: 'commercial', label: 'Commercial Sites' },
    ];
  }

  @Get('countries')
  @ApiOperation({
    summary: 'Get available countries',
    description: 'Returns list of available countries with codes, flags, and translation keys'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Countries retrieved successfully',
    type: [CountryDto],
    schema: {
      type: 'array',
      items: {
        $ref: getSchemaPath(CountryDto)
      }
    }
  })
  getCountries(): CountryDto[] {
    return [
      { code: 'DE', flag: '🇩🇪', nameKey: 'countries.germany' },
      { code: 'FR', flag: '🇫🇷', nameKey: 'countries.france' },
      { code: 'IT', flag: '🇮🇹', nameKey: 'countries.italy' },
      { code: 'ES', flag: '🇪🇸', nameKey: 'countries.spain' },
      { code: 'GB', flag: '🇬🇧', nameKey: 'countries.united_kingdom' },
      { code: 'NL', flag: '🇳🇱', nameKey: 'countries.netherlands' },
      { code: 'BE', flag: '🇧🇪', nameKey: 'countries.belgium' },
      { code: 'PL', flag: '🇵🇱', nameKey: 'countries.poland' },
    ];
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

      console.log('🔥 Backend Proxying Chat Request to Agent API:', {
        chatId,
        userId: auth.userId,
        messageCount: messages.length,
        toolsEnabled: tools?.length || 0,
        timestamp: requestTimestamp || new Date().toISOString()
      });

      const processedMessages: ChatMessage[] = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));

      const chatName = this.deriveChatName(messages);
      try {
        await this.chatService.ensureChatExists({
          chatId,
          userId: auth.userId,
          name: chatName
        });
      } catch (ensureError) {
        console.error('Failed to ensure chat exists:', ensureError);
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

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (lastUserMessage && lastUserMessageDto) {
        try {
          let filterId = null;
          let filterVersion = null;

          if (lastUserMessageDto.filterId && lastUserMessageDto.filterVersion) {
            filterId = lastUserMessageDto.filterId;
            filterVersion = lastUserMessageDto.filterVersion;
            await this.chatService.setActiveFilter(chatId, auth.userId, filterId);
            console.log('💾 Filter set as active:', filterId, 'version:', filterVersion);
          }

          await this.chatService.addMessage({
            id: lastUserMessage.id,
            chatId,
            userId: auth.userId,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
            timestamp: lastUserMessage.timestamp,
            metadata: {
              'iagent-version': environment.app.version,
              'session-id': sessionId
            },
            filterId,
            filterVersion: filterVersion || undefined
          });

          console.log('💬 User message saved with filter data');
        } catch (error) {
          console.error('Failed to save user message with filter data:', error);
        }
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');

      try {
        const agentApiUrl = `${environment.agentApi.url}/api/chat/stream`;
        console.log('🔄 Forwarding request to agent-api:', agentApiUrl);

        const response = await firstValueFrom(
          this.httpService.post(agentApiUrl, request, {
            responseType: 'stream',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );

        const stream = response.data;
        const decoder = new TextDecoder();
        let finalContent = '';
        let completeChunk: { chunkType: string; data?: { finalContent?: string } } | null = null;
        let buffer = '';

        try {
          for await (const chunk of stream) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                const parsed = JSON.parse(line);
                
                if (parsed.chunkType === 'token' && parsed.data?.token) {
                  finalContent += parsed.data.token;
                }
                
                if (parsed.chunkType === 'complete') {
                  completeChunk = parsed;
                }

                res.write(line + '\n');
              } catch (parseError) {
                console.error('Failed to parse chunk:', parseError);
              }
            }
          }

          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              
              if (parsed.chunkType === 'token' && parsed.data?.token) {
                finalContent += parsed.data.token;
              }
              
              if (parsed.chunkType === 'complete') {
                completeChunk = parsed;
              }

              res.write(buffer + '\n');
            } catch (parseError) {
              console.error('Failed to parse final buffer:', parseError);
            }
          }

          if (completeChunk?.data?.finalContent) {
            finalContent = completeChunk.data.finalContent;
          }

          if (assistantPlaceholderDto?.role === 'assistant') {
            try {
              await this.chatService.addMessage({
                id: assistantPlaceholderDto.id,
                chatId,
                userId: auth.userId,
                role: 'assistant',
                content: finalContent,
                timestamp: new Date(),
                metadata: {
                  'iagent-version': environment.app.version,
                  'session-id': sessionId
                },
                filterId: assistantPlaceholderDto.filterId || lastUserMessageDto?.filterId || null,
                filterVersion: assistantPlaceholderDto.filterVersion || lastUserMessageDto?.filterVersion || null,
              });
              console.log('🤖 Assistant message saved to chat history');
            } catch (saveError) {
              console.error('Failed to save assistant message:', saveError);
            }
          }

          res.end();
        } catch (streamError) {
          console.error('Error streaming from agent-api:', streamError);
          throw streamError;
        }
      } catch (innerError) {
        console.error('Error proxying to agent-api:', innerError);

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
              message: 'An error occurred while proxying to agent-api',
              code: 'PROXY_ERROR',
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
}
