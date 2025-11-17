import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatMessage, ChatMessageDocument, ChatFilter, ChatFilterDocument } from '../schemas/chat.schema';


export interface CreateMessageDto {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  filterId?: string | null;
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  } | null;
  chatName?: string | null;
}

export interface CreateFilterDto {
  filterId: string;
  name: string;
  userId: string;
  chatId: string;
  filterConfig: Record<string, unknown>;
  isActive?: boolean;
}

export interface EnsureChatParams {
  chatId: string;
  userId: string;
  name?: string;
  timestamp?: Date;
}

export interface CreateChatInput {
  userId: string;
  chatId?: string;
  name?: string;
  settings?: Record<string, unknown>;
}


@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Optional() @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Optional() @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
    @Optional() @InjectModel(ChatFilter.name) private filterModel: Model<ChatFilterDocument>,
  ) {
    if (!this.chatModel || !this.messageModel || !this.filterModel) {
      this.logger.error('❌ MongoDB models not available - ChatService requires MongoDB to be configured');
      throw new Error('MongoDB models are required. Please ensure MONGODB_URI is configured correctly.');
    }
    this.logger.log('🚀 MongoDB enabled - data will persist');
  }

  // ==================== MESSAGE MANAGEMENT ====================

  async addMessage(messageDto: CreateMessageDto): Promise<ChatMessageDocument> {
    const timestamp = messageDto.timestamp || new Date();
    const chatNameHint = messageDto.chatName?.trim()
      || (messageDto.role === 'user' ? this.createInitialChatName(messageDto.content) : undefined);
    const chat = await this.ensureChatExists({
      chatId: messageDto.chatId,
      userId: messageDto.userId,
      name: chatNameHint,
      timestamp,
    });

    // Check if message already exists to prevent duplicates
    const existingMessage = await this.messageModel.findOne({
      id: messageDto.id,
      chatId: messageDto.chatId,
      userId: messageDto.userId,
    }).exec();

    if (existingMessage) {
      this.logger.log(`Message ${messageDto.id} already exists, skipping duplicate save`);
      // Update lastMessageAt but don't increment message count
      await this.chatModel.findOneAndUpdate(
        { chatId: messageDto.chatId, userId: messageDto.userId },
        {
          lastMessageAt: timestamp,
        }
      ).exec();
      return existingMessage;
    }

    let filterId = messageDto.filterId ?? null;
    let filterSnapshot = messageDto.filterSnapshot ?? null;

    if (chat.activeFilterId && !filterId) {
      const activeFilter = await this.filterModel.findOne({ filterId: chat.activeFilterId, userId: messageDto.userId }).exec();
      if (activeFilter) {
        filterId = activeFilter.filterId;
        filterSnapshot = {
          filterId: activeFilter.filterId,
          name: activeFilter.name,
          config: activeFilter.filterConfig,
        };
      }
    }

    const messageWithFilter = {
      ...messageDto,
      timestamp,
      filterId,
      filterSnapshot,
    };

    const message = new this.messageModel(messageWithFilter);
    const savedMessage = await message.save();

    await this.chatModel.findOneAndUpdate(
      { chatId: messageDto.chatId, userId: messageDto.userId },
      {
        lastMessageAt: timestamp,
        $inc: { messageCount: 1 },
      }
    ).exec();

    return savedMessage;
  }

  async createChat(input: CreateChatInput): Promise<ChatDocument> {
    const name = input.name?.trim() || 'New Chat';
    const chatId = (input.chatId ?? `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`).trim();

    // Check if chat already exists
    const existing = await this.chatModel.findOne({ chatId, userId: input.userId }).exec();
    if (existing) {
      // Return existing chat instead of throwing error
      return existing;
    }

    const now = new Date();

    try {
      const chat = new this.chatModel({
        chatId,
        userId: input.userId,
        name,
        createdAt: now,
        lastMessageAt: now,
        messageCount: 0,
        settings: input.settings ?? {},
      });

      return await chat.save();
    } catch (error: unknown) {
      // Handle duplicate key error (11000) - chat was created by another request
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        // Try to find the existing chat
        const existingChat = await this.chatModel.findOne({ chatId, userId: input.userId }).exec();
        if (existingChat) {
          return existingChat;
        }
      }
      // Re-throw if it's not a duplicate key error or chat not found
      throw error;
    }
  }

  async getChat(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    return chat;
  }

  async ensureChatExists(params: EnsureChatParams): Promise<ChatDocument> {
    const { chatId, userId, name, timestamp } = params;
    const now = timestamp || new Date();
    const defaultName = name?.trim() || 'New Chat';

    // Check MongoDB connection
    const connection = this.chatModel.db;
    if (!connection || connection.readyState !== 1) {
      this.logger.warn(`MongoDB connection not ready (state: ${connection?.readyState || 'unknown'}), attempting to continue...`);
    }

    try {
      const result = await this.chatModel.findOneAndUpdate(
        { chatId, userId },
        {
          $setOnInsert: {
            chatId,
            userId,
            name: defaultName,
            createdAt: now,
          },
          $set: {
            lastMessageAt: now,
            updatedAt: now,
          },
        },
        { upsert: true, new: true }
      ).exec();

      if (!result) {
        // If result is null, try to find the chat
        const existingChat = await this.chatModel.findOne({ chatId, userId }).exec();
        if (existingChat) {
          // Update lastMessageAt and updatedAt
          const updated = await this.chatModel.findOneAndUpdate(
            { chatId, userId },
            {
              $set: {
                lastMessageAt: now,
                updatedAt: now,
              },
            },
            { new: true }
          ).exec();
          if (updated) {
            return updated;
          }
        }
        // If still no result, create a new chat document
        const newChat = new this.chatModel({
          chatId,
          userId,
          name: defaultName,
          createdAt: now,
          lastMessageAt: now,
          updatedAt: now,
        });
        return await newChat.save();
      }

      return result;
    } catch (error: unknown) {
      console.error('Error in ensureChatExists:', error);
      
      // Handle duplicate key error (11000) - chat already exists
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        // Try to find the existing chat
        try {
          const existingChat = await this.chatModel.findOne({ chatId, userId }).exec();
          if (existingChat) {
            // Update lastMessageAt and updatedAt
            const updated = await this.chatModel.findOneAndUpdate(
              { chatId, userId },
              {
                $set: {
                  lastMessageAt: now,
                  updatedAt: now,
                },
              },
              { new: true }
            ).exec();
            if (updated) {
              return updated;
            }
          }
        } catch (findError) {
          console.error('Error finding existing chat:', findError);
        }
      }

      // If MongoDB connection error or other error, try to find existing chat
      try {
        const existingChat = await this.chatModel.findOne({ chatId, userId }).exec();
        if (existingChat) {
          return existingChat;
        }
      } catch (findError) {
        console.error('Error finding chat after initial error:', findError);
      }

      // Re-throw if we can't handle it
      throw error;
    }
  }

  async updateChatName(chatId: string, userId: string, name: string): Promise<ChatDocument> {
    const normalized = name.trim();
    if (!normalized) {
      throw new BadRequestException('Chat name cannot be empty');
    }

    const chat = await this.chatModel.findOneAndUpdate(
      { chatId, userId },
      { name: normalized, updatedAt: new Date() },
      { new: true }
    ).exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    return chat;
  }

  async listChats(userId: string): Promise<ChatDocument[]> {
    return this.chatModel
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getChatMessages(chatId: string, userId: string): Promise<ChatMessageDocument[]> {
    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      // Return empty array instead of throwing - allows frontend to handle gracefully
      return [];
    }

    return this.messageModel
      .find({ chatId, userId })
      .sort({ timestamp: 1 })
      .exec();
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findOneAndDelete({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    await Promise.all([
      this.messageModel.deleteMany({ chatId, userId }).exec(),
      this.filterModel.deleteMany({ chatId, userId }).exec(),
    ]);
  }

  async deleteMessagesFrom(chatId: string, userId: string, messageId: string): Promise<void> {
    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const targetMessage = await this.messageModel
      .findOne({ chatId, userId, id: messageId })
      .exec();

    if (!targetMessage) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.messageModel
      .deleteMany({ chatId, userId, timestamp: { $gte: targetMessage.timestamp } })
      .exec();

    const latestMessage = await this.messageModel
      .findOne({ chatId, userId })
      .sort({ timestamp: -1 })
      .exec();

    const remainingCount = await this.messageModel.countDocuments({ chatId, userId }).exec();

    await this.chatModel.findOneAndUpdate(
      { chatId, userId },
      {
        lastMessageAt: latestMessage?.timestamp || chat.createdAt,
        messageCount: remainingCount,
      }
    ).exec();
  }

  async editMessage(
    chatId: string,
    userId: string,
    messageId: string,
    content: string,
    filterSnapshot?: {
      filterId?: string;
      name?: string;
      config?: Record<string, unknown>;
    } | null
  ): Promise<ChatMessageDocument> {
    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const targetMessage = await this.messageModel
      .findOne({ chatId, userId, id: messageId })
      .exec();

    if (!targetMessage) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    if (targetMessage.role !== 'user') {
      throw new BadRequestException('Only user messages can be edited');
    }

    await this.messageModel
      .deleteMany({ chatId, userId, timestamp: { $gt: targetMessage.timestamp } })
      .exec();

    const updatedMessage = await this.messageModel.findOneAndUpdate(
      { chatId, userId, id: messageId },
      {
        content,
        filterId: filterSnapshot?.filterId || null,
        filterSnapshot: filterSnapshot || null,
        timestamp: new Date(),
      },
      { new: true }
    ).exec();

    if (!updatedMessage) {
      throw new NotFoundException(`Failed to update message ${messageId}`);
    }

    const remainingCount = await this.messageModel.countDocuments({ chatId, userId }).exec();

    await this.chatModel.findOneAndUpdate(
      { chatId, userId },
      {
        lastMessageAt: updatedMessage.timestamp,
        messageCount: remainingCount,
      }
    ).exec();

    return updatedMessage;
  }

  private createInitialChatName(content: string | undefined): string | undefined {
    if (!content) {
      return undefined;
    }

    const normalized = content.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
  }


  // ==================== FILTER MANAGEMENT ====================

  async createFilter(createFilterDto: CreateFilterDto): Promise<ChatFilterDocument> {
    const filter = new this.filterModel(createFilterDto);
    const savedFilter = await filter.save();
    
    // Update chat's associated filters
    await this.chatModel.findOneAndUpdate(
      { chatId: createFilterDto.chatId, userId: createFilterDto.userId },
      { 
        $addToSet: { associatedFilters: createFilterDto.filterId }
      }
    ).exec();
    
    return savedFilter;
  }

  async getFiltersForChat(chatId: string, userId: string): Promise<ChatFilterDocument[]> {
    return await this.filterModel
      .find({ chatId, userId })
      .sort({ createdAt: -1 })
      .exec();
  }


  async updateFilter(filterId: string, userId: string, updateData: Partial<CreateFilterDto>): Promise<ChatFilterDocument> {
    const filter = await this.filterModel
      .findOneAndUpdate(
        { filterId, userId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      )
      .exec();

    if (!filter) {
      throw new NotFoundException(`Filter with ID ${filterId} not found`);
    }
    return filter;
  }

  async deleteFilter(filterId: string, userId: string): Promise<void> {
    const filter = await this.filterModel.findOneAndDelete({ filterId, userId }).exec();
    
    if (!filter) {
      throw new NotFoundException(`Filter with ID ${filterId} not found`);
    }

    // Remove filter from chat's associated filters
    await this.chatModel.updateMany(
      { userId },
      { $pull: { associatedFilters: filterId } }
    ).exec();

    // If this was the active filter, clear it
    await this.chatModel.updateMany(
      { userId, activeFilterId: filterId },
      { $unset: { activeFilterId: 1 }, $set: { currentFilterConfig: null } }
    ).exec();
  }

  async setActiveFilter(chatId: string, userId: string, filterId: string | null): Promise<ChatDocument> {
    // Deactivate all filters for this chat
    await this.filterModel.updateMany(
      { chatId, userId },
      { isActive: false }
    ).exec();

    // Activate the selected filter
    let filterConfig = null;
    if (filterId) {
      const filter = await this.filterModel.findOneAndUpdate(
        { filterId, userId, chatId },
        { isActive: true },
        { new: true }
      ).exec();
      
      if (!filter) {
        throw new NotFoundException(`Filter with ID ${filterId} not found`);
      }
      filterConfig = filter.filterConfig;
    }

    // Update chat with active filter
    const chat = await this.chatModel.findOneAndUpdate(
      { chatId, userId },
      { 
        activeFilterId: filterId,
        currentFilterConfig: filterConfig 
      },
      { new: true }
    ).exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    
    return chat;
  }

} 