import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { Chat, ChatDocument, ChatMessage, ChatMessageDocument, ChatFilter, ChatFilterDocument } from '../schemas/chat.schema';
import { env } from '../../config/env';

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

export interface FileUploadData {
  fileId: string;
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
  chatId: string;
  userId: string;
}

// Demo mode storage (in-memory)
const demoChats: Map<string, any> = new Map();
const demoMessages: Map<string, any[]> = new Map();
const demoFilters: Map<string, any> = new Map();
const demoFiles: Map<string, { data: string; metadata: any }> = new Map();

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly isDemoMode: boolean;
  private gridFSBucket: GridFSBucket | null = null;

  constructor(
    @Optional() @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Optional() @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
    @Optional() @InjectModel(ChatFilter.name) private filterModel: Model<ChatFilterDocument>,
    @Optional() @InjectConnection() private connection: Connection,
  ) {
    // Check if MongoDB is available (demo mode detection)
    this.isDemoMode = env.DEMO_MODE || !env.MONGODB_URI || !this.chatModel || !this.messageModel || !this.filterModel;

    if (this.isDemoMode) {
      this.logger.warn('🚨 Running in DEMO MODE - data will not persist and MongoDB is disabled');
      this.initializeDemoData();
    } else {
      this.logger.log('🚀 MongoDB mode enabled - data will persist');
      // Initialize GridFS bucket for file storage
      if (this.connection?.db) {
        this.gridFSBucket = new GridFSBucket(this.connection.db, {
          bucketName: 'uploads',
        });
        this.logger.log('📁 GridFS bucket initialized for file storage');
      }
    }
  }

  private initializeDemoData() {
    // Initialize some demo data
    const demoChat = {
      chatId: 'demo-chat-001',
      name: 'Demo Chat',
      userId: 'user_123456789',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      settings: {},
      tags: ['demo'],
      archived: false,
      messageCount: 2
    };

    const demoMessagesList = [
      {
        id: 'msg_demo_001',
        chatId: 'demo-chat-001',
        userId: 'user_123456789',
        role: 'user' as const,
        content: 'Hello! This is a demo message with filter settings.',
        timestamp: new Date(Date.now() - 60000),
        metadata: {},
        filterId: 'filter_demo_001',
        filterSnapshot: {
          filterId: 'filter_demo_001',
          name: 'Demo Work Filter',
          config: {
            dateFilter: {
              type: 'custom',
              customRange: { amount: 7, type: 'days' }
            },
            selectedCountries: ['PS', 'LB', 'SA'],
            enabledTools: ['tool-x', 'tool-y'],
            filterText: 'work related queries',
            selectedMode: 'flow',
            excludeAmi: false,
            includeAmi: true
          }
        }
      },
      {
        id: 'msg_demo_002',
        chatId: 'demo-chat-001',
        userId: 'user_123456789',
        role: 'assistant' as const,
        content: 'Hello! Welcome to the demo. This chat is stored in memory and will reset when you restart the server. 🎯 **Notice the info icon (ℹ️) on the user message above** - click it to see the filter configuration that was used!',
        timestamp: new Date(),
        metadata: { model: 'demo-assistant', tokens: 25 },
        filterId: 'filter_demo_001',
        filterSnapshot: {
          filterId: 'filter_demo_001',
          name: 'Demo Work Filter',
          config: {
            dateFilter: {
              type: 'picker',
              dateRange: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: new Date()
              }
            },
            selectedCountries: ['PS', 'LB', 'SA'],
            enabledTools: ['tool-x', 'tool-y'],
            filterText: 'work related queries',
            selectedMode: 'flow',
            excludeAmi: false,
            includeAmi: true
          }
        }
      }
    ];

    demoChats.set('demo-chat-001', demoChat);
    demoMessages.set('demo-chat-001', demoMessagesList);

    // Initialize demo filter
    const demoFilter = {
      filterId: 'filter_demo_001',
      name: 'Demo Work Filter',
      userId: 'user_123456789',
      chatId: 'demo-chat-001',
      filterConfig: {
        dateFilter: {
          type: 'custom',
          customRange: { amount: 7, type: 'days' }
        },
        selectedCountries: ['PS', 'LB', 'SA'],
        enabledTools: ['tool-x', 'tool-y'],
        filterText: 'work related queries',
        selectedMode: 'flow',
        excludeAmi: false,
        includeAmi: true
      },
      createdAt: new Date(Date.now() - 120000),
      updatedAt: new Date(Date.now() - 120000),
      isActive: true
    };
    demoFilters.set('filter_demo_001', demoFilter);
  }

  // ==================== CHAT MANAGEMENT ====================

  async createChat(createChatDto: CreateChatDto): Promise<any> {
    if (this.isDemoMode) {
      const chat = {
        ...createChatDto,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        archived: false,
        messageCount: 0,
        settings: createChatDto.settings || {},
        tags: createChatDto.tags || []
      };
      demoChats.set(createChatDto.chatId, chat);
      demoMessages.set(createChatDto.chatId, []);
      return chat;
    }

    const chat = new this.chatModel(createChatDto);
    return await chat.save();
  }

  async findChatsByUser(userId: string, includeArchived = false): Promise<any[]> {
    if (this.isDemoMode) {
      const chats = Array.from(demoChats.values())
        .filter(chat => chat.userId === userId)
        .filter(chat => includeArchived || !chat.archived)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      return chats;
    }

    const query = includeArchived
      ? { userId }
      : { userId, archived: { $ne: true } };

    return await this.chatModel
      .find(query)
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findChatById(chatId: string, userId: string): Promise<any> {
    if (this.isDemoMode) {
      const chat = demoChats.get(chatId);
      if (!chat || chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }
      return chat;
    }

    const chat = await this.chatModel.findOne({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }
    return chat;
  }

  async updateChat(chatId: string, userId: string, updateData: UpdateChatDto): Promise<any> {
    if (this.isDemoMode) {
      const chat = demoChats.get(chatId);
      if (!chat || chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }
      Object.assign(chat, updateData);
      demoChats.set(chatId, chat);
      return chat;
    }

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
    if (this.isDemoMode) {
      const chat = demoChats.get(chatId);
      if (!chat || chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }
      demoChats.delete(chatId);
      demoMessages.delete(chatId);
      return;
    }

    const chat = await this.chatModel.findOneAndDelete({ chatId, userId }).exec();
    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Delete all messages in this chat
    await this.messageModel.deleteMany({ chatId, userId }).exec();
  }

  // ==================== MESSAGE MANAGEMENT ====================

  async addMessage(messageDto: CreateMessageDto): Promise<any> {
    if (this.isDemoMode) {
      // Get current active filter for the chat
      const chat = demoChats.get(messageDto.chatId);
      let filterSnapshot = null;

      if (chat && chat.activeFilterId) {
        const activeFilter = demoFilters.get(chat.activeFilterId);
        if (activeFilter) {
          filterSnapshot = {
            filterId: activeFilter.filterId,
            name: activeFilter.name,
            config: activeFilter.filterConfig
          };
        }
      }

      const message = {
        ...messageDto,
        timestamp: messageDto.timestamp || new Date(),
        metadata: messageDto.metadata || {},
        filterId: chat?.activeFilterId || null,
        filterSnapshot
      };

      const messages = demoMessages.get(messageDto.chatId) || [];
      messages.push(message);
      demoMessages.set(messageDto.chatId, messages);

      // Update chat's lastMessageAt and messageCount
      if (chat) {
        chat.lastMessageAt = message.timestamp;
        chat.messageCount = messages.length;
        demoChats.set(messageDto.chatId, chat);
      }

      return message;
    }

    // Get current active filter for the chat for non-demo mode
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
    if (this.isDemoMode) {
      const messages = demoMessages.get(chatId) || [];
      return messages
        .filter(msg => msg.userId === userId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(offset, offset + limit);
    }

    return await this.messageModel
      .find({ chatId, userId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    if (this.isDemoMode) {
      for (const [chatId, messages] of demoMessages.entries()) {
        const messageIndex = messages.findIndex(msg => msg.id === messageId && msg.userId === userId);
        if (messageIndex !== -1) {
          messages.splice(messageIndex, 1);
          demoMessages.set(chatId, messages);

          // Update chat's messageCount
          const chat = demoChats.get(chatId);
          if (chat) {
            chat.messageCount = messages.length;
            chat.lastMessageAt = messages.length > 0
              ? messages[messages.length - 1].timestamp
              : chat.createdAt;
            demoChats.set(chatId, chat);
          }
          return;
        }
      }
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

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
    if (this.isDemoMode) {
      const userChats = Array.from(demoChats.values()).filter(chat => chat.userId === userId);
      const totalMessages = Array.from(demoMessages.values())
        .flat()
        .filter(msg => msg.userId === userId).length;

      return {
        totalChats: userChats.length,
        archivedChats: userChats.filter(chat => chat.archived).length,
        totalMessages,
        isDemoMode: true
      };
    }

    const totalChats = await this.chatModel.countDocuments({ userId });
    const archivedChats = await this.chatModel.countDocuments({ userId, archived: true });
    const totalMessages = await this.messageModel.countDocuments({ userId });

    return {
      totalChats,
      archivedChats,
      totalMessages,
      isDemoMode: false
    };
  }

  // ==================== FILTER MANAGEMENT ====================

  async createFilter(createFilterDto: CreateFilterDto): Promise<any> {
    if (this.isDemoMode) {
      const filter = {
        ...createFilterDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: createFilterDto.isActive ?? false
      };
      demoFilters.set(createFilterDto.filterId, filter);

      // Update chat's associated filters
      const chat = demoChats.get(createFilterDto.chatId);
      if (chat && chat.userId === createFilterDto.userId) {
        if (!chat.associatedFilters) chat.associatedFilters = [];
        if (!chat.associatedFilters.includes(createFilterDto.filterId)) {
          chat.associatedFilters.push(createFilterDto.filterId);
        }
        demoChats.set(createFilterDto.chatId, chat);
      }

      return filter;
    }

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
    if (this.isDemoMode) {
      return Array.from(demoFilters.values())
        .filter(filter => filter.chatId === chatId && filter.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return await this.filterModel
      .find({ chatId, userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFilterById(filterId: string, userId: string): Promise<any> {
    if (this.isDemoMode) {
      const filter = demoFilters.get(filterId);
      if (!filter || filter.userId !== userId) {
        throw new NotFoundException(`Filter with ID ${filterId} not found`);
      }
      return filter;
    }

    const filter = await this.filterModel.findOne({ filterId, userId }).exec();
    if (!filter) {
      throw new NotFoundException(`Filter with ID ${filterId} not found`);
    }
    return filter;
  }

  async updateFilter(filterId: string, userId: string, updateData: Partial<CreateFilterDto>): Promise<any> {
    if (this.isDemoMode) {
      const filter = demoFilters.get(filterId);
      if (!filter || filter.userId !== userId) {
        throw new NotFoundException(`Filter with ID ${filterId} not found`);
      }
      Object.assign(filter, updateData, { updatedAt: new Date() });
      demoFilters.set(filterId, filter);
      return filter;
    }

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
    if (this.isDemoMode) {
      const filter = demoFilters.get(filterId);
      if (!filter || filter.userId !== userId) {
        throw new NotFoundException(`Filter with ID ${filterId} not found`);
      }
      demoFilters.delete(filterId);

      // Remove from chat's associated filters
      const chat = demoChats.get(filter.chatId);
      if (chat && chat.associatedFilters) {
        chat.associatedFilters = chat.associatedFilters.filter((id: string) => id !== filterId);
        demoChats.set(filter.chatId, chat);
      }

      return;
    }

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
    if (this.isDemoMode) {
      const chat = demoChats.get(chatId);
      if (!chat || chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      // Deactivate all filters for this chat
      Array.from(demoFilters.values())
        .filter(f => f.chatId === chatId && f.userId === userId)
        .forEach(f => {
          f.isActive = false;
          demoFilters.set(f.filterId, f);
        });

      // Activate the selected filter
      if (filterId) {
        const filter = demoFilters.get(filterId);
        if (filter && filter.userId === userId && filter.chatId === chatId) {
          filter.isActive = true;
          demoFilters.set(filterId, filter);
          chat.activeFilterId = filterId;
          chat.currentFilterConfig = filter.filterConfig;
        }
      } else {
        chat.activeFilterId = null;
        chat.currentFilterConfig = null;
      }

      demoChats.set(chatId, chat);
      return chat;
    }

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

  getDemoStatus(): { isDemoMode: boolean; reason?: string } {
    if (this.isDemoMode) {
      return {
        isDemoMode: true,
        reason: env.DEMO_MODE
          ? 'DEMO_MODE environment variable is set'
          : 'No MONGODB_URI environment variable found'
      };
    }
    return { isDemoMode: false };
  }

  // ==================== FILE MANAGEMENT ====================

  async uploadFile(fileData: FileUploadData): Promise<any> {
    const { fileId, buffer, filename, mimetype, size, chatId, userId } = fileData;

    if (this.isDemoMode) {
      // Store file as base64 in demo mode
      const base64Data = buffer.toString('base64');
      const fileMetadata = {
        fileId,
        name: filename,
        size,
        type: mimetype,
        chatId,
        userId,
        uploadedAt: new Date(),
        base64Data,
      };
      demoFiles.set(fileId, { data: base64Data, metadata: fileMetadata });
      this.logger.log(`📁 File uploaded in demo mode: ${filename} (${fileId})`);
      return fileMetadata;
    }

    // Upload to GridFS in production mode
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }

    return new Promise((resolve, reject) => {
      const readableStream = Readable.from(buffer);
      const uploadStream = this.gridFSBucket!.openUploadStream(filename, {
        metadata: {
          fileId,
          chatId,
          userId,
          originalName: filename,
          mimetype,
          size,
          uploadedAt: new Date(),
        },
      });

      readableStream.pipe(uploadStream);

      uploadStream.on('finish', () => {
        const fileMetadata = {
          fileId,
          name: filename,
          size,
          type: mimetype,
          chatId,
          userId,
          uploadedAt: new Date(),
          gridfsId: uploadStream.id.toString(),
        };
        this.logger.log(`📁 File uploaded to GridFS: ${filename} (${fileId})`);
        resolve(fileMetadata);
      });

      uploadStream.on('error', (error) => {
        this.logger.error(`Failed to upload file to GridFS: ${error.message}`);
        reject(error);
      });
    });
  }

  async downloadFile(fileId: string, userId: string): Promise<{ stream: Readable; metadata: any }> {
    console.log("is demo mode - ", this.isDemoMode);
    if (this.isDemoMode) {
      const file = demoFiles.get(fileId);
      if (!file || file.metadata.userId !== userId) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      // Convert base64 back to buffer and create readable stream
      const buffer = Buffer.from(file.data, 'base64');
      const stream = Readable.from(buffer);

      return {
        stream,
        metadata: file.metadata,
      };
    }

    // Download from GridFS
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }

    // First, find the file in GridFS by metadata.fileId
    const files = await this.gridFSBucket
      .find({ 'metadata.fileId': fileId, 'metadata.userId': userId })
      .toArray();

    if (files.length === 0) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const file = files[0];
    const downloadStream = this.gridFSBucket.openDownloadStream(file._id);

    return {
      stream: downloadStream,
      metadata: {
        fileId: file.metadata?.fileId,
        name: file.filename,
        size: file.length,
        type: file.metadata?.mimetype,
        uploadedAt: file.uploadDate,
      },
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    if (this.isDemoMode) {
      const file = demoFiles.get(fileId);
      if (!file || file.metadata.userId !== userId) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      demoFiles.delete(fileId);
      this.logger.log(`🗑️ File deleted from demo storage: ${fileId}`);
      return;
    }

    // Delete from GridFS
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }

    // Find the file in GridFS by metadata.fileId
    const files = await this.gridFSBucket
      .find({ 'metadata.fileId': fileId, 'metadata.userId': userId })
      .toArray();

    if (files.length === 0) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const file = files[0];
    await this.gridFSBucket.delete(file._id);
    this.logger.log(`🗑️ File deleted from GridFS: ${fileId}`);
  }

  async getFileMetadata(fileId: string, userId: string): Promise<any> {
    if (this.isDemoMode) {
      const file = demoFiles.get(fileId);
      if (!file || file.metadata.userId !== userId) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      return file.metadata;
    }

    // Get metadata from GridFS
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }

    const files = await this.gridFSBucket
      .find({ 'metadata.fileId': fileId, 'metadata.userId': userId })
      .toArray();

    if (files.length === 0) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const file = files[0];
    return {
      fileId: file.metadata?.fileId,
      name: file.filename,
      size: file.length,
      type: file.metadata?.mimetype,
      chatId: file.metadata?.chatId,
      uploadedAt: file.uploadDate,
      gridfsId: file._id.toString(),
    };
  }
} 