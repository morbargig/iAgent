import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
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