import type { Message, ParsedMessageContent } from '@iagent/chat-types';
import { buildParsedMessageContent } from '@iagent/chat-types';

export type SectionType = 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer';

export interface SectionMetadata {
  section: SectionType;
  contentType?: 'citation' | 'table' | 'report' | 'markdown';
}

export interface SectionContent {
  content: string;
  parsed: ParsedMessageContent;
}

export interface EnhancedParsedMessageContent extends ParsedMessageContent {
  section?: SectionType;
  contentType?: string;
}

export interface ChunkConverterInput {
  content: string;
  section?: SectionType;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface MongoMessageInput {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
  filterId?: string | null;
  filterVersion?: number | null;
}

export const convertContentToParsedMessage = (
  input: ChunkConverterInput
): EnhancedParsedMessageContent => {
  const parsed = buildParsedMessageContent(input.content);

  return {
    ...parsed,
    section: input.section,
    contentType: input.contentType,
  };
};

export const convertMongoMessageToMessage = (
  mongoMessage: MongoMessageInput
): Message => {
  const sectionMetadata = (mongoMessage.metadata?.section || mongoMessage.metadata?.currentSection) as
    | SectionType
    | undefined;
  const contentType = mongoMessage.metadata?.contentType as string | undefined;
  const sections = mongoMessage.metadata?.sections as Record<string, { content: string; parsed: ParsedMessageContent }> | undefined;
  const parsedFromMetadata = mongoMessage.metadata?.parsed as ParsedMessageContent | undefined;
  const attachmentIds = (mongoMessage.metadata?.attachmentIds as string[] | undefined) || [];

  const parsed = parsedFromMetadata || convertContentToParsedMessage({
    content: mongoMessage.content,
    section: sectionMetadata,
    contentType,
    metadata: mongoMessage.metadata,
  });

  return {
    id: mongoMessage.id,
    role: mongoMessage.role === 'system' ? 'assistant' : mongoMessage.role,
    content: mongoMessage.content,
    timestamp:
      typeof mongoMessage.timestamp === 'string'
        ? new Date(mongoMessage.timestamp)
        : mongoMessage.timestamp,
    isStreaming: false,
    isInterrupted: false,
    filterId: mongoMessage.filterId || null,
    filterVersion: mongoMessage.filterVersion || null,
    metadata: {
      ...mongoMessage.metadata,
      attachmentIds,
    },
    parsed,
    sections,
    currentSection: sectionMetadata,
  };
};

export const convertStreamingChunkToMessage = (
  content: string,
  section?: SectionType,
  contentType?: string,
  metadata?: Record<string, unknown>
): Message => {
  const parsed = convertContentToParsedMessage({
    content,
    section,
    contentType,
    metadata,
  });

  return {
    id: `streaming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming: false,
    isInterrupted: false,
    filterId: null,
    filterVersion: null,
    metadata,
    parsed,
    currentSection: section,
  };
};

