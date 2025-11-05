import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
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

@ApiTags('Chat Management')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) { }

  // ==================== CHAT ENDPOINTS ====================


  // ==================== FILTER ENDPOINTS ====================

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
            enabledTools: ['tool-x', 'tool-y'],
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
    @Body() filterData: any
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