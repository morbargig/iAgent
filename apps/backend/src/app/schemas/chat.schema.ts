import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;
export type ChatDocument = Chat & Document;
export type ChatFilterDocument = ChatFilter & Document;

// Filter schema for storing filter configurations with versioning
@Schema({ timestamps: true })
export class ChatFilter {
  @Prop({ required: true })
  filterId!: string;

  @Prop({ required: true })
  version!: number;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ type: String, default: null })
  chatId!: string | null;

  @Prop({ type: Object, required: true })
  filterConfig!: {
    dateFilter?: {
      type: 'custom' | 'picker';
      customRange?: {
        amount: number;
        type: string;
      };
      dateRange?: {
        start: Date;
        end: Date;
      };
    };
    selectedCountries?: string[];
    enabledTools?: string[];
    filterText?: string;
    excludeAmi?: boolean;
    includeAmi?: boolean;
    selectedMode?: 'free' | 'flow' | 'product';
    customFilters?: Record<string, any>;
  };

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  @Prop({ default: false })
  isActive!: boolean;
}

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string;

  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;

  @Prop({ required: true })
  chatId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ type: String, default: null })
  filterId!: string | null;

  @Prop({ type: Number, default: null })
  filterVersion!: number | null;
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  chatId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  lastMessageAt!: Date;

  @Prop({ type: Object, default: {} })
  settings!: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  archived!: boolean;

  @Prop({ default: 0 })
  messageCount!: number;

  // Current active filter for this chat
  @Prop({ type: String, default: null })
  activeFilterId!: string | null;

  // Array of all filter IDs associated with this chat
  @Prop({ type: [String], default: [] })
  associatedFilters!: string[];

  // Current filter configuration (for quick access)
  @Prop({ type: Object, default: null })
  currentFilterConfig!: Record<string, any> | null;
}

export const ChatFilterSchema = SchemaFactory.createForClass(ChatFilter);
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatFilterSchema.index({ filterId: 1, version: 1 }, { unique: true });
ChatFilterSchema.index({ userId: 1, chatId: 1 });
ChatFilterSchema.index({ userId: 1, isActive: 1 });
ChatFilterSchema.index({ userId: 1 });

ChatMessageSchema.index({ chatId: 1, timestamp: 1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });
ChatMessageSchema.index({ filterId: 1, filterVersion: 1 });

ChatSchema.index({ userId: 1, lastMessageAt: -1 });
ChatSchema.index({ userId: 1, archived: 1, lastMessageAt: -1 });
ChatSchema.index({ activeFilterId: 1 });
// Compound unique index: chatId must be unique per user
ChatSchema.index({ chatId: 1, userId: 1 }, { unique: true }); 