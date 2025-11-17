import type {
  ParsedMessageContent,
} from '@iagent/shared-renderer';
import {
  buildParsedMessageContent,
} from '@iagent/shared-renderer';

export type {
  ParsedMessageContent,
} from '@iagent/shared-renderer';
export {
  buildParsedMessageContent,
} from '@iagent/shared-renderer';

export function chatTypes(): string {
  return 'chat-types';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isInterrupted?: boolean; // Add flag to indicate if generation was stopped in the middle
  filterId?: string | null; // Associated filter ID
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  } | null; // Filter configuration snapshot at time of message creation
  attachments?: Array<{
    id: string;
    filename?: string;
    name?: string;
    size: number;
    mimetype?: string;
    mimeType?: string;
    uploadDate?: string;
    uploadedAt?: string;
  }>;
  metadata?: {
    index?: number;
    total_tokens?: number;
    timestamp?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    processing_time_ms?: number;
    confidence?: number;
    categories?: string[];
    section?: 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer';
    contentType?: string;
    attachmentIds?: string[];
  };
  parsed?: ParsedMessageContent;
  sections?: Record<string, { content: string; parsed: ParsedMessageContent }>;
  currentSection?: 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer';
}

export interface Conversation {
  id: string;
  title: string;
  titleKey?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

export interface StreamTokenDto {
  token: string;
  done: boolean;
  metadata?: {
    index?: number;
    total_tokens?: number;
    timestamp?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    processing_time_ms?: number;
    confidence?: number;
    categories?: string[];
    progress?: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}


// const normalizeLineEndings = (input: string): string => input.replace(/\r\n/g, '\n');

// const isDividerLine = (line: string): boolean => /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim());

// const extractHeading = (line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null => {
//   const match = line.trim().match(/^(#{1,6})\s+(.*)$/);
//   if (!match) {
//     return null;
//   }
//   const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
//   const text = match[2].trim();
//   return { level, text };
// };

// const extractListItem = (line: string): { ordered: boolean; text: string } | null => {
//   const trimmed = line.trim();
//   const unordered = trimmed.match(/^[-*+]\s+(.*)$/);
//   if (unordered) {
//     return { ordered: false, text: unordered[1].trim() };
//   }
//   const ordered = trimmed.match(/^(\d+)\.\s+(.*)$/);
//   if (ordered) {
//     return { ordered: true, text: ordered[2].trim() };
//   }
//   return null;
// };

// const isCodeFence = (line: string): { language?: string } | null => {
//   const trimmed = line.trim();
//   if (!trimmed.startsWith('```')) {
//     return null;
//   }
//   const language = trimmed.slice(3).trim();
//   return { language: language || undefined };
// };

// const isQuoteLine = (line: string): boolean => line.trim().startsWith('>');

// const isParagraphBoundary = (line: string): boolean => {
//   const trimmed = line.trim();
//   if (!trimmed) {
//     return true;
//   }
//   return (
//     isDividerLine(trimmed) ||
//     Boolean(extractHeading(trimmed)) ||
//     Boolean(extractListItem(trimmed)) ||
//     Boolean(isCodeFence(trimmed)) ||
//     isQuoteLine(trimmed)
//   );
// };

// const TABLE_DIVIDER_REGEX = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/;

// const trimTableEdges = (line: string): string => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');

// const splitTableRow = (line: string): string[] => {
//   const cleaned = trimTableEdges(line.trim());
//   return cleaned
//     .split('|')
//     .map((cell) => cell.replace(/\\\|/g, '|').trim());
// };

// interface ParsedTableResult {
//   headers: string[];
//   rows: string[][];
//   nextIndex: number;
// }

// const tryParseTable = (lines: string[], startIndex: number): ParsedTableResult | null => {
//   if (startIndex + 1 >= lines.length) {
//     return null;
//   }

//   const headerLine = lines[startIndex];
//   const dividerLine = lines[startIndex + 1];

//   if (!headerLine.includes('|') || !TABLE_DIVIDER_REGEX.test(dividerLine)) {
//     return null;
//   }

//   const headers = splitTableRow(headerLine);
//   let nextIndex = startIndex + 2;
//   const rows: string[][] = [];

//   while (nextIndex < lines.length) {
//     const candidate = lines[nextIndex];
//     if (!candidate.trim() || !candidate.includes('|')) {
//       break;
//     }
//     const cells = splitTableRow(candidate);
//     rows.push(cells);
//     nextIndex++;
//   }

//   if (headers.length === 0 || rows.length === 0) {
//     return null;
//   }

//   return {
//     headers,
//     rows,
//     nextIndex
//   };
// };

// const TABLE_CAPTION_REGEX = /^(?:table|טבלה)\s*[:\-]\s*(.+)$/i;
// const REPORT_BLOCK_REGEX = /^report\s*[:\-]\s*(\{[\s\S]*\})$/i;

export const hydrateMessagesWithParsedContent = (messages: Message[]): Message[] =>
  messages.map((message) => ({
    ...message,
    parsed: buildParsedMessageContent(message.content),
  }));


// Helper functions for message management
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  isStreaming = false,
  filterId?: string | null,
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  } | null
): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    isStreaming,
    filterId: filterId || null,
    filterSnapshot: filterSnapshot || null,
  };
}

export function createStreamingMessage(role: 'user' | 'assistant'): Message {
  return createMessage(role, '', true);
}

export function updateMessageContent(message: Message, content: string, isStreaming = false, isInterrupted = false): Message {
  return {
    ...message,
    content,
    isStreaming,
    isInterrupted
  };
}

// Validation utilities
export function validateChatRequest(request: unknown): ChatRequest {
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid request: request must be an object');
  }
  
  const req = request as { messages?: unknown; model?: string; temperature?: number; max_tokens?: number; stream?: boolean };
  
  if (!req.messages || !Array.isArray(req.messages)) {
    throw new Error('Invalid request: messages array is required');
  }
  
  if (req.messages.length === 0) {
    throw new Error('Invalid request: at least one message is required');
  }
  
  return {
    messages: req.messages as Message[],
    model: req.model || 'gpt-3.5-turbo',
    temperature: req.temperature || 0.7,
    max_tokens: req.max_tokens || 2048,
    stream: req.stream !== false
  };
}
