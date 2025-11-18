import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiUnauthorizedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { environment } from '../../environments/environment';
import {
  ChatRequestDto,
  ChatMessageDto,
} from '../dto/chat.dto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

@ApiTags('Chat Streaming')
@ApiExtraModels(ChatRequestDto)
@Controller('chat')
export class StreamingController {
  constructor(
    private readonly chatService: ChatService,
    private readonly httpService: HttpService
  ) {}

  @Post('stream')
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

      const abortController = new AbortController();
      let isClientDisconnected = false;
      let streamDestroyed = false;

      const handleClientDisconnect = () => {
        if (!isClientDisconnected) {
          isClientDisconnected = true;
          console.log('⚠️ Client disconnected, canceling stream to agent-api');
          abortController.abort();
          if (!streamDestroyed) {
            streamDestroyed = true;
          }
        }
      };

      res.on('close', handleClientDisconnect);
      res.on('error', handleClientDisconnect);

      try {
        const agentApiUrl = `${environment.agentApi.url}/api/chat/stream`;
        console.log('🔄 Forwarding request to agent-api:', agentApiUrl);

        const response = await firstValueFrom(
          this.httpService.post(agentApiUrl, request, {
            responseType: 'stream',
            signal: abortController.signal,
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

        stream.on('error', (error: Error) => {
          if (error.name === 'AbortError' || isClientDisconnected) {
            console.log('✅ Stream canceled due to client disconnect');
            return;
          }
          console.error('Stream error:', error);
        });

        try {
          for await (const chunk of stream) {
            if (isClientDisconnected) {
              console.log('✅ Stopping stream processing - client disconnected');
              break;
            }

            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              
              if (isClientDisconnected) {
                break;
              }

              try {
                const parsed = JSON.parse(line);
                
                if (parsed.chunkType === 'token' && parsed.data?.token) {
                  finalContent += parsed.data.token;
                }
                
                if (parsed.chunkType === 'complete') {
                  completeChunk = parsed;
                }

                if (!isClientDisconnected) {
                  res.write(line + '\n');
                }
              } catch (parseError) {
                console.error('Failed to parse chunk:', parseError);
              }
            }
          }

          if (!isClientDisconnected) {
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

            if (assistantPlaceholderDto?.role === 'assistant' && finalContent) {
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

            if (!res.closed) {
              res.end();
            }
          } else {
            console.log('⚠️ Client disconnected before stream completion');
            if (stream && typeof stream.destroy === 'function') {
              stream.destroy();
            }
          }
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

