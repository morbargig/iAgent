import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ChatRequestDto, StreamTokenDto, ErrorResponseDto, AuthTokenDto, ToolSelectionDto, ChatMessageDto, type ChatMessage } from './dto/stream.dto';
import { MockGenerationService } from './services/mock-generation.service';
import { StreamingService } from './services/streaming.service';
import { environment } from '../environments/environment';

@ApiTags('Agent API')
@ApiExtraModels(ChatRequestDto, StreamTokenDto, ErrorResponseDto, AuthTokenDto, ToolSelectionDto, ChatMessageDto)
@Controller()
export class AppController {
  constructor(
    private readonly mockGenerationService: MockGenerationService,
    private readonly streamingService: StreamingService
  ) {}

  @Post('chat/stream')
  @ApiOperation({
    summary: 'Send a chat message with structured streaming response',
    description: 'Send a message to the AI assistant and receive a streaming response with structured chunks. Each chunk has a specific type (start, token, metadata, progress, complete, error) for better control and visualization.'
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

      console.log('🔥 Agent API Chat Request:', {
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

      const promptTokenCount = this.streamingService.countTokens(processedMessages);

      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }

      const lastUserMessage = lastUserMessageIndex >= 0 ? processedMessages[lastUserMessageIndex] : undefined;
      const lastUserContent = lastUserMessage?.content || '';

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');

      try {
        const startChunk = {
          chunkType: 'start',
          data: {
            message: 'Starting response generation',
            model: 'chatgpt-clone-v1',
            promptTokens: promptTokenCount,
            categories: this.streamingService.categorizeContent(lastUserContent),
            conversationLength: processedMessages.length
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(startChunk) + '\n');

        const hasToolT = tools && Array.isArray(tools) && tools.some((t: any) => t?.id === 'tool-t' || t?.name === 'tool-t');
        const hasToolH = tools && Array.isArray(tools) && tools.some((t: any) => t?.id === 'tool-h' || t?.name === 'tool-h');
        const hasToolF = tools && Array.isArray(tools) && tools.some((t: any) => t?.id === 'tool-f' || t?.name === 'tool-f');
        
        const shouldGenerateToolSections = (hasToolT || hasToolH || hasToolF) || Math.random() < 0.3;

        const startTime = new Date();
        let totalTokens = 0;
        let currentContent = '';
        let toolTTokens: string[] = [];
        let toolHTokens: string[] = [];
        let toolFTokens: string[] = [];

        const metadataChunk = {
          chunkType: 'metadata',
          data: {
            totalTokens: 0,
            estimatedDuration: 0,
            contentType: 'text/markdown',
            language: 'en',
            responseType: this.streamingService.getResponseType(lastUserContent)
          },
          timestamp: new Date().toISOString(),
          sessionId
        };
        res.write(JSON.stringify(metadataChunk) + '\n');

        if (shouldGenerateToolSections) {
          if (hasToolT || Math.random() < 0.5) {
            const toolTContent = this.mockGenerationService.generateToolTSection();
            toolTTokens = this.streamingService.tokenizeResponse(toolTContent);
            totalTokens += toolTTokens.length;

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
                  totalTokens: 0,
                  progress: 0,
                  cumulativeContent: currentContent,
                  tokenType: this.streamingService.getTokenType(token),
                  confidence: 0.92 + Math.random() * 0.07,
                  isLastToken: false,
                  section: 'tool-t',
                  contentType: this.streamingService.detectContentType(token, toolTContentAccumulator)
                },
                timestamp: new Date().toISOString(),
                sessionId
              };
              res.write(JSON.stringify(tokenChunk) + '\n');

              if (i < toolTTokens.length - 1) {
                const delay = this.streamingService.calculateStreamingDelay(token, i, toolTTokens);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

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

          if (hasToolH || Math.random() < 0.5) {
            const toolHContent = this.mockGenerationService.generateToolHSection();
            toolHTokens = this.streamingService.tokenizeResponse(toolHContent);
            totalTokens += toolHTokens.length;

            const toolHSectionStart = {
              chunkType: 'section',
              data: {
                section: 'tool-h',
                contentType: 'markdown',
                action: 'start'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolHSectionStart) + '\n');

            let toolHContentAccumulator = '';
            for (let i = 0; i < toolHTokens.length; i++) {
              const token = toolHTokens[i];
              toolHContentAccumulator += token;
              currentContent += token;

              const tokenChunk = {
                chunkType: 'token',
                data: {
                  token,
                  index: toolTTokens.length + i + 1,
                  totalTokens: 0,
                  progress: 0,
                  cumulativeContent: currentContent,
                  tokenType: this.streamingService.getTokenType(token),
                  confidence: 0.92 + Math.random() * 0.07,
                  isLastToken: false,
                  section: 'tool-h',
                  contentType: this.streamingService.detectContentType(token, toolHContentAccumulator)
                },
                timestamp: new Date().toISOString(),
                sessionId
              };
              res.write(JSON.stringify(tokenChunk) + '\n');

              if (i < toolHTokens.length - 1) {
                const delay = this.streamingService.calculateStreamingDelay(token, i, toolHTokens);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            const toolHSectionEnd = {
              chunkType: 'section',
              data: {
                section: 'tool-h',
                contentType: 'markdown',
                action: 'end'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolHSectionEnd) + '\n');
          }

          if (hasToolF || Math.random() < 0.5) {
            const toolFContent = this.mockGenerationService.generateToolFSection();
            toolFTokens = this.streamingService.tokenizeResponse(toolFContent);
            totalTokens += toolFTokens.length;

            const toolFSectionStart = {
              chunkType: 'section',
              data: {
                section: 'tool-f',
                contentType: 'markdown',
                action: 'start'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolFSectionStart) + '\n');

            let toolFContentAccumulator = '';
            for (let i = 0; i < toolFTokens.length; i++) {
              const token = toolFTokens[i];
              toolFContentAccumulator += token;
              currentContent += token;

              const tokenChunk = {
                chunkType: 'token',
                data: {
                  token,
                  index: toolTTokens.length + toolHTokens.length + i + 1,
                  totalTokens: 0,
                  progress: 0,
                  cumulativeContent: currentContent,
                  tokenType: this.streamingService.getTokenType(token),
                  confidence: 0.92 + Math.random() * 0.07,
                  isLastToken: false,
                  section: 'tool-f',
                  contentType: this.streamingService.detectContentType(token, toolFContentAccumulator)
                },
                timestamp: new Date().toISOString(),
                sessionId
              };
              res.write(JSON.stringify(tokenChunk) + '\n');

              if (i < toolFTokens.length - 1) {
                const delay = this.streamingService.calculateStreamingDelay(token, i, toolFTokens);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            const toolFSectionEnd = {
              chunkType: 'section',
              data: {
                section: 'tool-f',
                contentType: 'markdown',
                action: 'end'
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(toolFSectionEnd) + '\n');
          }
        }

        const response = await this.mockGenerationService.generateContextualResponse(processedMessages);

        const answerTokens = this.streamingService.tokenizeResponse(response);
        totalTokens += answerTokens.length;

        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

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

        for (let i = 0; i < answerTokens.length; i++) {
          const token = answerTokens[i];
          const isLast = i === answerTokens.length - 1;

          currentContent += token;

          const tokenChunk = {
            chunkType: 'token',
            data: {
              token,
              index: toolTTokens.length + toolHTokens.length + toolFTokens.length + i + 1,
              totalTokens: totalTokens,
              progress: Math.round(((toolTTokens.length + toolHTokens.length + toolFTokens.length + i + 1) / totalTokens) * 100),
              cumulativeContent: currentContent,
              tokenType: this.streamingService.getTokenType(token),
              confidence: 0.92 + Math.random() * 0.07,
              isLastToken: isLast,
              section: 'answer',
              contentType: 'markdown'
            },
            timestamp: new Date().toISOString(),
            sessionId
          };

          res.write(JSON.stringify(tokenChunk) + '\n');

          if (i > 0 && i % 10 === 0 && !isLast) {
            const progressChunk = {
              chunkType: 'progress',
              data: {
                progress: Math.round(((toolTTokens.length + toolHTokens.length + toolFTokens.length + i + 1) / totalTokens) * 100),
                tokensProcessed: toolTTokens.length + toolHTokens.length + toolFTokens.length + i + 1,
                tokensRemaining: answerTokens.length - i - 1,
                processingTimeMs: Date.now() - startTime.getTime(),
                estimatedRemainingMs: Math.round((answerTokens.length - i - 1) * 50),
                averageTokenTime: Math.round((Date.now() - startTime.getTime()) / (toolTTokens.length + toolHTokens.length + toolFTokens.length + i + 1))
              },
              timestamp: new Date().toISOString(),
              sessionId
            };
            res.write(JSON.stringify(progressChunk) + '\n');
          }

          if (!isLast) {
            const delay = this.streamingService.calculateStreamingDelay(token, i, answerTokens);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

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
}
