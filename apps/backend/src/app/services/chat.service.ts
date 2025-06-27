import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatMessage, ChatMessageDocument } from '../schemas/chat.schema';

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
}

export interface UpdateChatDto {
  name?: string;
  settings?: Record<string, any>;
  tags?: string[];
  archived?: boolean;
}

// Demo mode storage (in-memory)
const demoChats: Map<string, any> = new Map();
const demoMessages: Map<string, any[]> = new Map();

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly isDemoMode: boolean;

  constructor(
    @Optional() @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Optional() @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
  ) {
    // Check if MongoDB is available (demo mode detection)
    this.isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.MONGODB_URI || !this.chatModel || !this.messageModel;
    
    if (this.isDemoMode) {
      this.logger.warn('🚨 Running in DEMO MODE - data will not persist and MongoDB is disabled');
      this.initializeDemoData();
    } else {
      this.logger.log('🚀 MongoDB mode enabled - data will persist');
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
        content: 'Hello! This is a demo message.',
        timestamp: new Date(Date.now() - 60000),
        metadata: {}
      },
      {
        id: 'msg_demo_002',
        chatId: 'demo-chat-001',
        userId: 'user_123456789',
        role: 'assistant' as const,
        content: 'Hello! Welcome to the demo. This chat is stored in memory and will reset when you restart the server.',
        timestamp: new Date(),
        metadata: { model: 'demo-assistant', tokens: 25 }
      }
    ];

    demoChats.set('demo-chat-001', demoChat);
    demoMessages.set('demo-chat-001', demoMessagesList);
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
      const message = {
        ...messageDto,
        timestamp: messageDto.timestamp || new Date(),
        metadata: messageDto.metadata || {}
      };
      
      const messages = demoMessages.get(messageDto.chatId) || [];
      messages.push(message);
      demoMessages.set(messageDto.chatId, messages);
      
      // Update chat's lastMessageAt and messageCount
      const chat = demoChats.get(messageDto.chatId);
      if (chat) {
        chat.lastMessageAt = message.timestamp;
        chat.messageCount = messages.length;
        demoChats.set(messageDto.chatId, chat);
      }
      
      return message;
    }

    const message = new this.messageModel(messageDto);
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

  getDemoStatus(): { isDemoMode: boolean; reason?: string } {
    if (this.isDemoMode) {
      return {
        isDemoMode: true,
        reason: process.env.DEMO_MODE === 'true' 
          ? 'DEMO_MODE environment variable is set' 
          : 'No MONGODB_URI environment variable found'
      };
    }
    return { isDemoMode: false };
  }
} 