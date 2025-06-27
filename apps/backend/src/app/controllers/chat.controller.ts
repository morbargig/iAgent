import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Logger,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import type { CreateChatDto, CreateMessageDto, UpdateChatDto } from '../services/chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../decorators/user.decorator';
import { Public } from '../decorators/public.decorator';

@ApiTags('Chat Management')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  // ==================== CHAT ENDPOINTS ====================

  @Get('status')
  @Public()
  @ApiOperation({
    summary: 'Get chat service status',
    description: 'Returns the status of the chat service including demo mode information (public endpoint)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isDemoMode: { type: 'boolean' },
        reason: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  getStatus() {
    const demoStatus = this.chatService.getDemoStatus();
    return {
      ...demoStatus,
      timestamp: new Date().toISOString()
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get user chat statistics',
    description: 'Returns statistics about user chats and messages. Requires Bearer token authentication.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalChats: { type: 'number' },
        archivedChats: { type: 'number' },
        totalMessages: { type: 'number' },
        isDemoMode: { type: 'boolean' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getUserStats(@UserId() userId: string) {
    try {
      return await this.chatService.getChatStats(userId);
    } catch (error) {
      this.logger.error(`Failed to get stats for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve user statistics');
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new chat',
    description: 'Creates a new chat conversation for the authenticated user. Requires Bearer token authentication.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', example: 'chat_1638360000000_abc123' },
        name: { type: 'string', example: 'My New Chat' },
        settings: { type: 'object', example: { model: 'gpt-4', temperature: 0.7 } },
        tags: { type: 'array', items: { type: 'string' }, example: ['work', 'typescript'] }
      },
      required: ['chatId', 'name']
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chat created successfully',
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string' },
        name: { type: 'string' },
        userId: { type: 'string' },
        createdAt: { type: 'string' },
        lastMessageAt: { type: 'string' },
        messageCount: { type: 'number' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  async createChat(@UserId() userId: string, @Body() createChatData: any) {
    try {
      const createChatDto: CreateChatDto = {
        ...createChatData,
        userId
      };
      const chat = await this.chatService.createChat(createChatDto);
      this.logger.log(`Created chat ${createChatDto.chatId} for user ${createChatDto.userId}`);
      return chat;
    } catch (error) {
      this.logger.error(`Failed to create chat:`, error);
      throw new BadRequestException('Failed to create chat');
    }
  }

  @Get('list')
  @ApiOperation({
    summary: 'Get all chats for a user',
    description: 'Retrieves all chats for the authenticated user, optionally including archived chats. Requires Bearer token authentication.'
  })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean, description: 'Include archived chats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chats retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
          name: { type: 'string' },
          userId: { type: 'string' },
          createdAt: { type: 'string' },
          lastMessageAt: { type: 'string' },
          messageCount: { type: 'number' },
          archived: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getUserChats(
    @UserId() userId: string,
    @Query('includeArchived') includeArchived?: boolean
  ) {
    try {
      const chats = await this.chatService.findChatsByUser(userId, includeArchived === true);
      return chats;
    } catch (error) {
      this.logger.error(`Failed to get chats for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve chats');
    }
  }

  @Get(':chatId')
  @ApiOperation({
    summary: 'Get a specific chat',
    description: 'Retrieves a specific chat by ID for the authenticated user. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat retrieved successfully'
  })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getChat(@Param('chatId') chatId: string, @UserId() userId: string) {
    return await this.chatService.findChatById(chatId, userId);
  }

  @Put(':chatId')
  @ApiOperation({
    summary: 'Update a chat',
    description: 'Updates chat information such as name, settings, or archive status. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Chat Name' },
        settings: { type: 'object', example: { model: 'gpt-4', temperature: 0.8 } },
        tags: { type: 'array', items: { type: 'string' }, example: ['updated', 'important'] },
        archived: { type: 'boolean', example: false }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat updated successfully'
  })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async updateChat(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Body() updateData: UpdateChatDto
  ) {
    try {
      const updatedChat = await this.chatService.updateChat(chatId, userId, updateData);
      this.logger.log(`Updated chat ${chatId} for user ${userId}`);
      return updatedChat;
    } catch (error) {
      this.logger.error(`Failed to update chat ${chatId}:`, error);
      throw error;
    }
  }

  @Delete(':chatId')
  @ApiOperation({
    summary: 'Delete a chat',
    description: 'Permanently deletes a chat and all its messages. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Chat deleted successfully'
  })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async deleteChat(@Param('chatId') chatId: string, @UserId() userId: string) {
    try {
      await this.chatService.deleteChat(chatId, userId);
      this.logger.log(`Deleted chat ${chatId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete chat ${chatId}:`, error);
      throw error;
    }
  }

  // ==================== MESSAGE ENDPOINTS ====================

  @Post(':chatId/messages')
  @ApiOperation({
    summary: 'Add a message to a chat',
    description: 'Adds a new message to an existing chat. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'msg_1638360000000_abc123' },
        role: { type: 'string', enum: ['user', 'assistant', 'system'], example: 'user' },
        content: { type: 'string', example: 'Hello, how can you help me?' },
        timestamp: { type: 'string', format: 'date-time' },
        metadata: { type: 'object', example: { tokenCount: 25 } }
      },
      required: ['id', 'role', 'content']
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message added successfully'
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiBadRequestResponse({ description: 'Invalid message data' })
  async addMessage(@Param('chatId') chatId: string, @UserId() userId: string, @Body() messageData: any) {
    try {
      const messageDto: CreateMessageDto = {
        ...messageData,
        chatId,
        userId,
        timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date()
      };
      
      const message = await this.chatService.addMessage(messageDto);
      this.logger.log(`Added message ${messageDto.id} to chat ${chatId}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to add message to chat ${chatId}:`, error);
      throw new BadRequestException('Failed to add message');
    }
  }

  @Get(':chatId/messages')
  @ApiOperation({
    summary: 'Get messages from a chat',
    description: 'Retrieves messages from a specific chat with pagination. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to retrieve (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of messages to skip (default: 0)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          role: { type: 'string' },
          content: { type: 'string' },
          timestamp: { type: 'string' },
          metadata: { type: 'object' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getChatMessages(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    try {
      const messages = await this.chatService.getMessages(
        chatId, 
        userId, 
        limit || 50, 
        offset || 0
      );
      return messages;
    } catch (error) {
      this.logger.error(`Failed to get messages for chat ${chatId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve messages');
    }
  }

  @Delete('messages/:messageId')
  @ApiOperation({
    summary: 'Delete a message',
    description: 'Permanently deletes a specific message. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Message deleted successfully'
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async deleteMessage(@Param('messageId') messageId: string, @UserId() userId: string) {
    try {
      await this.chatService.deleteMessage(messageId, userId);
      this.logger.log(`Deleted message ${messageId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${messageId}:`, error);
      throw error;
    }
  }
} 