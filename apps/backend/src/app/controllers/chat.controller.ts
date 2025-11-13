import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Put,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import type { CreateFilterDto } from '../services/chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../decorators/user.decorator';
import { UpdateChatNameDto } from '../dto/chat.dto';

@ApiTags('Chat Management')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) { }

  // ==================== CHAT ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'List chats for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chats retrieved successfully'
  })
  async listChats(@UserId() userId: string) {
    try {
      return await this.chatService.listChats(userId);
    } catch (error) {
      this.logger.error(`Failed to list chats for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve chats');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', example: 'chat_1638360000000_abc123' },
        name: { type: 'string', example: 'New Chat' }
      },
      required: ['chatId', 'name']
    }
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chat created successfully' })
  async createChat(
    @UserId() userId: string,
    @Body() body: { chatId: string; name: string }
  ) {
    try {
      return await this.chatService.createChat({
        userId,
        chatId: body.chatId,
        name: body.name
      });
    } catch (error) {
      this.logger.error(`Failed to create chat ${body.chatId} for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to create chat');
    }
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get a specific chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat retrieved successfully' })
  async getChat(@Param('chatId') chatId: string, @UserId() userId: string) {
    try {
      return await this.chatService.getChat(chatId, userId);
    } catch (error) {
      this.logger.error(`Failed to get chat ${chatId} for user ${userId}:`, error);
      throw error;
    }
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Add a message to a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'msg_1638360000000_abc123' },
        role: { type: 'string', enum: ['user', 'assistant', 'system'], example: 'user' },
        content: { type: 'string', example: 'Hello!' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z' },
        metadata: { type: 'object', example: {} },
        filterId: { type: 'string', nullable: true },
        filterSnapshot: { type: 'object', nullable: true }
      },
      required: ['id', 'role', 'content', 'timestamp']
    }
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message added successfully' })
  async addMessage(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Body() body: {
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
      filterId?: string | null;
      filterSnapshot?: {
        filterId?: string;
        name?: string;
        config?: Record<string, unknown>;
      } | null;
    }
  ) {
    try {
      return await this.chatService.addMessage({
        id: body.id,
        chatId,
        userId,
        role: body.role,
        content: body.content,
        timestamp: new Date(body.timestamp),
        metadata: body.metadata,
        filterId: body.filterId,
        filterSnapshot: body.filterSnapshot
      });
    } catch (error) {
      this.logger.error(`Failed to add message ${body.id} to chat ${chatId}:`, error);
      throw new InternalServerErrorException('Failed to add message');
    }
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get all messages for a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully' })
  async getChatMessages(@Param('chatId') chatId: string, @UserId() userId: string) {
    try {
      return await this.chatService.getChatMessages(chatId, userId);
    } catch (error) {
      this.logger.error(`Failed to get messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  @Put(':chatId/name')
  @ApiOperation({ summary: 'Rename chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: UpdateChatNameDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat renamed successfully' })
  async renameChat(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Body() body: UpdateChatNameDto
  ) {
    try {
      return await this.chatService.updateChatName(chatId, userId, body.name);
    } catch (error) {
      this.logger.error(`Failed to rename chat ${chatId}:`, error);
      throw error;
    }
  }

  @Delete(':chatId')
  @ApiOperation({ summary: 'Delete chat and associated data' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Chat deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChat(@Param('chatId') chatId: string, @UserId() userId: string) {
    try {
      await this.chatService.deleteChat(chatId, userId);
    } catch (error) {
      this.logger.error(`Failed to delete chat ${chatId}:`, error);
      throw error;
    }
  }

  @Delete(':chatId/messages/:messageId')
  @ApiOperation({ summary: 'Delete message and subsequent history' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID to delete from' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Chat history truncated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessagesFrom(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @UserId() userId: string
  ) {
    try {
      await this.chatService.deleteMessagesFrom(chatId, userId, messageId);
    } catch (error) {
      this.logger.error(`Failed to delete messages from ${messageId} in chat ${chatId}:`, error);
      throw error;
    }
  }

  @Put(':chatId/messages/:messageId')
  @ApiOperation({ summary: 'Edit a message and delete all messages after it' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID to edit' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Updated message content' },
        filterSnapshot: {
          type: 'object',
          nullable: true,
          properties: {
            filterId: { type: 'string' },
            name: { type: 'string' },
            config: { type: 'object' },
          },
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message edited successfully' })
  async editMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @UserId() userId: string,
    @Body() body: {
      content: string;
      filterSnapshot?: {
        filterId?: string;
        name?: string;
        config?: Record<string, unknown>;
      } | null;
    }
  ) {
    try {
      return await this.chatService.editMessage(
        chatId,
        userId,
        messageId,
        body.content,
        body.filterSnapshot
      );
    } catch (error) {
      this.logger.error(`Failed to edit message ${messageId} in chat ${chatId}:`, error);
      throw error;
    }
  }


  // ==================== FILTER ENDPOINTS ====================
  // Note: More specific routes (filters/:filterId) must come before parameterized routes (:chatId/filters)

  @Put('filters/:filterId')
  @ApiOperation({
    summary: 'Update a filter',
    description: 'Updates filter configuration. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'filterId', description: 'Filter ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Filter Name' },
        filterConfig: { type: 'object', example: { updatedField: 'value' } },
        isActive: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filter updated successfully'
  })
  @ApiNotFoundResponse({ description: 'Filter not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async updateFilter(
    @Param('filterId') filterId: string,
    @UserId() userId: string,
    @Body() updateData: Partial<CreateFilterDto>
  ) {
    try {
      const updatedFilter = await this.chatService.updateFilter(filterId, userId, updateData);
      this.logger.log(`Updated filter ${filterId} for user ${userId}`);
      return updatedFilter;
    } catch (error) {
      this.logger.error(`Failed to update filter ${filterId}:`, error);
      throw error;
    }
  }

  @Delete('filters/:filterId')
  @ApiOperation({
    summary: 'Delete a filter',
    description: 'Deletes a filter configuration. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'filterId', description: 'Filter ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Filter deleted successfully'
  })
  @ApiNotFoundResponse({ description: 'Filter not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFilter(
    @Param('filterId') filterId: string,
    @UserId() userId: string
  ) {
    try {
      await this.chatService.deleteFilter(filterId, userId);
      this.logger.log(`Deleted filter ${filterId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete filter ${filterId}:`, error);
      throw error;
    }
  }

  @Post(':chatId/filters')
  @ApiOperation({
    summary: 'Create a new filter for a chat',
    description: 'Creates a new filter configuration for the specified chat. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filterId: { type: 'string', example: 'filter_1638360000000_abc123' },
        name: { type: 'string', example: 'Work Filter' },
        filterConfig: {
          type: 'object',
          example: {
            dateFilter: {
              type: 'custom',
              customRange: { amount: 7, type: 'days' }
            },
            selectedCountries: ['PS', 'LB'],
            enabledTools: ['tool-t', 'tool-h'],
            filterText: 'work related',
            selectedMode: 'flow'
          }
        },
        isActive: { type: 'boolean', example: false }
      },
      required: ['filterId', 'name', 'filterConfig']
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Filter created successfully'
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  async createFilter(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Body() filterData: Omit<CreateFilterDto, 'userId' | 'chatId'>
  ) {
    try {
      const createFilterDto: CreateFilterDto = {
        ...filterData,
        userId,
        chatId
      };
      const filter = await this.chatService.createFilter(createFilterDto);
      this.logger.log(`Created filter ${createFilterDto.filterId} for chat ${chatId}`);
      return filter;
    } catch (error) {
      this.logger.error(`Failed to create filter for chat ${chatId}:`, error);
      throw new BadRequestException('Failed to create filter');
    }
  }

  @Get(':chatId/filters')
  @ApiOperation({
    summary: 'Get all filters for a chat',
    description: 'Retrieves all filter configurations for the specified chat. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filters retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filterId: { type: 'string' },
          name: { type: 'string' },
          userId: { type: 'string' },
          chatId: { type: 'string' },
          filterConfig: { type: 'object' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getChatFilters(@Param('chatId') chatId: string, @UserId() userId: string) {
    try {
      return await this.chatService.getFiltersForChat(chatId, userId);
    } catch (error) {
      this.logger.error(`Failed to get filters for chat ${chatId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve filters');
    }
  }

  @Put(':chatId/active-filter')
  @ApiOperation({
    summary: 'Set active filter for a chat',
    description: 'Sets the active filter for a chat. Pass null to deactivate all filters. Requires Bearer token authentication.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filterId: { type: 'string', nullable: true, example: 'filter_1638360000000_abc123' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active filter set successfully'
  })
  @ApiNotFoundResponse({ description: 'Chat or filter not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async setActiveFilter(
    @Param('chatId') chatId: string,
    @UserId() userId: string,
    @Body() body: { filterId: string | null }
  ) {
    try {
      const updatedChat = await this.chatService.setActiveFilter(chatId, userId, body.filterId);
      this.logger.log(`Set active filter ${body.filterId} for chat ${chatId}`);
      return updatedChat;
    } catch (error) {
      this.logger.error(`Failed to set active filter for chat ${chatId}:`, error);
      throw error;
    }
  }
} 