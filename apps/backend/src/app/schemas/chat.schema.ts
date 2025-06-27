import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;
export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true })
  chatId: string;

  @Prop({ required: true })
  userId: string;
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, unique: true })
  chatId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  lastMessageAt: Date;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  archived: boolean;

  @Prop({ default: 0 })
  messageCount: number;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
export const ChatSchema = SchemaFactory.createForClass(Chat);

// Add indexes for better performance
ChatMessageSchema.index({ chatId: 1, timestamp: 1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });
ChatSchema.index({ userId: 1, lastMessageAt: -1 });
ChatSchema.index({ userId: 1, archived: 1, lastMessageAt: -1 }); 