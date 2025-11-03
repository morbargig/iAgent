import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatMessage, ChatMessageDocument, ChatFilter, ChatFilterDocument } from '../schemas/chat.schema';

export interface CreateChatDto {
  chatId: string;
  name: string;
  userId: string;
  settings?: Record<string, any>;
  tags?: string[];
}

export interface CreateMessageDto {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
  filterId?: string;
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, any>;
  };
}

export interface CreateFilterDto {
  filterId: string;
  name: string;
  userId: string;
  chatId: string;
  filterConfig: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateChatDto {
  name?: string;
  settings?: Record<string, any>;
  tags?: string[];
  archived?: boolean;
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

  // ==================== CHAT MANAGEMENT ====================

  async createChat(createChatDto: CreateChatDto): Promise<any> {
    const chat = new this.chatModel(createChatDto);
    return await chat.save();
  }

  async findChatsByUser(userId: string, includeArchived = false): Promise<any[]> {
    const query = includeArchived 
      ? { userId } 
      : { userId, archived: { $ne: true } };
    
    return await this.chatModel
      .find(query)
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findChatById(chatId: string, userId: string): Promise<any> {
    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    return chat;
  }

  async updateChat(chatId: string, userId: string, updateData: UpdateChatDto): Promise<any> {
    const chat = await this.chatModel
      .findOneAndUpdate(
        { chatId, userId },
        updateData,
        { new: true }
      )
      .exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    return chat;
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findOneAndDelete({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    
    // Delete all messages in this chat
    await this.messageModel.deleteMany({ chatId, userId }).exec();
  }

  // ==================== MESSAGE MANAGEMENT ====================

  async addMessage(messageDto: CreateMessageDto): Promise<any> {
    // Get current active filter for the chat
    const chat = await this.chatModel.findOne({ chatId: messageDto.chatId, userId: messageDto.userId }).exec();
    let filterSnapshot = null;
    
    if (chat && chat.activeFilterId) {
      const activeFilter = await this.filterModel.findOne({ filterId: chat.activeFilterId, userId: messageDto.userId }).exec();
      if (activeFilter) {
        filterSnapshot = {
          filterId: activeFilter.filterId,
          name: activeFilter.name,
          config: activeFilter.filterConfig
        };
      }
    }
    
    const messageWithFilter = {
      ...messageDto,
      filterId: chat?.activeFilterId || null,
      filterSnapshot
    };
    
    const message = new this.messageModel(messageWithFilter);
    const savedMessage = await message.save();
    
    // Update chat's lastMessageAt and messageCount
    await this.chatModel.findOneAndUpdate(
      { chatId: messageDto.chatId, userId: messageDto.userId },
      { 
        lastMessageAt: messageDto.timestamp || new Date(),
        $inc: { messageCount: 1 }
      }
    ).exec();
    
    return savedMessage;
  }

  async getMessages(chatId: string, userId: string, limit = 50, offset = 0): Promise<any[]> {
    return await this.messageModel
      .find({ chatId, userId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findOneAndDelete({ id: messageId, userId }).exec();
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
    
    // Update chat's messageCount
    await this.chatModel.findOneAndUpdate(
      { chatId: message.chatId, userId },
      { $inc: { messageCount: -1 } }
    ).exec();
  }

  // ==================== UTILITY METHODS ====================

  async getChatStats(userId: string): Promise<any> {
    const totalChats = await this.chatModel.countDocuments({ userId });
    const archivedChats = await this.chatModel.countDocuments({ userId, archived: true });
    const totalMessages = await this.messageModel.countDocuments({ userId });
    
    return {
      totalChats,
      archivedChats,
      totalMessages
    };
  }

  // ==================== FILTER MANAGEMENT ====================

  async createFilter(createFilterDto: CreateFilterDto): Promise<any> {
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

  async getFiltersForChat(chatId: string, userId: string): Promise<any[]> {
    return await this.filterModel
      .find({ chatId, userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFilterById(filterId: string, userId: string): Promise<any> {
    const filter = await this.filterModel.findOne({ filterId, userId }).exec();
    if (!filter) {
      throw new NotFoundException(`Filter with ID ${filterId} not found`);
    }
    return filter;
  }

  async updateFilter(filterId: string, userId: string, updateData: Partial<CreateFilterDto>): Promise<any> {
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
    
    // Remove from chat's associated filters
    await this.chatModel.findOneAndUpdate(
      { chatId: filter.chatId, userId },
      { $pull: { associatedFilters: filterId } }
    ).exec();
  }

  async setActiveFilter(chatId: string, userId: string, filterId: string | null): Promise<any> {
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