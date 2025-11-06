import type {
  ChatContentBlock,
  CustomElementNode,
  ParsedMessageContent,
  StreamingChunk,
  StreamingMarkupBuilder,
  StreamingTokenMetadata,
  StreamingCompletionPayload,
} from '@iagent/shared-renderer';
import {
  buildParsedMessageContent,
  createStreamingMarkupBuilder,
  encodeBase64Json,
  encodeBase64Text,
  decodeBase64Json,
  decodeBase64Text,
} from '@iagent/shared-renderer';

export type {
  ChatContentBlock,
  CustomElementNode,
  ParsedMessageContent,
  StreamingChunk,
  StreamingMarkupBuilder,
  StreamingTokenMetadata,
  StreamingCompletionPayload,
} from '@iagent/shared-renderer';
export {
  encodeBase64Json,
  encodeBase64Text,
  decodeBase64Json,
  decodeBase64Text,
  buildParsedMessageContent,
  createStreamingMarkupBuilder,
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
  };
  parsed?: ParsedMessageContent;
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

// Tokenization utility for realistic streaming
export function tokenizeText(text: string): string[] {
  // Split by words but preserve spaces by adding them back to each token (except the last one)
  const words = text.split(/\s+/);
  return words.map((word, index) => 
    index < words.length - 1 ? word + ' ' : word
  );
}

// Calculate realistic delay between chunks
export function calculateDelay(chunk: string): number {
  const baseDelay = 40;
  const lengthFactor = Math.min(chunk.trim().length * 4, 40);
  const randomFactor = Math.random() * 30;
  return Math.max(20, baseDelay + lengthFactor + randomFactor);
}

// Tokenization utility for realistic streaming
export function tokenizeResponse(text: string): string[] {
  const tokens: string[] = [];
  
  // Handle different content types for more natural streaming
  const codeBlockRegex = /```[\s\S]*?```/g;
  const boldRegex = /\*\*(.*?)\*\*/g;
  
  let processedText = text;
  const preservedBlocks: { placeholder: string; content: string }[] = [];
  
  // Extract and preserve code blocks
  processedText = processedText.replace(codeBlockRegex, (match) => {
    const placeholder = `__CODE_BLOCK_${preservedBlocks.length}__`;
    preservedBlocks.push({ placeholder, content: match });
    return placeholder;
  });
  
  // Extract and preserve bold text
  processedText = processedText.replace(boldRegex, (match) => {
    const placeholder = `__BOLD_${preservedBlocks.length}__`;
    preservedBlocks.push({ placeholder, content: match });
    return placeholder;
  });
  
  // Better tokenization: split by words but keep trailing spaces and punctuation
  // This regex captures word + optional trailing space/punctuation as single tokens
  const wordPattern = /(\S+\s*|[.!?]+\s*|\n+)/g;
  let match;
  
  while ((match = wordPattern.exec(processedText)) !== null) {
    const token = match[1];
    
    // Check if this contains a preserved block
    const preservedBlock = preservedBlocks.find(block => token.includes(block.placeholder));
    if (preservedBlock) {
      tokens.push(preservedBlock.content);
    } else {
      tokens.push(token);
    }
  }
  
  return tokens;
}

// Calculate realistic streaming delay based on token content
export function calculateStreamingDelay(token: string, index: number): number {
  const baseDelay = 50; // Base delay in milliseconds
  
  // Different delays for different content types
  if (token.startsWith('```')) return 300; // Code blocks
  if (token.startsWith('**') && token.endsWith('**')) return 150; // Bold text
  if (token.startsWith('#')) return 200; // Headers
  if (token.match(/^[-*+]\s/)) return 150; // List items
  if (token.match(/[.!?]+/)) return 250; // End of sentences (longer pause)
  if (token.match(/[,;:]/)) return 100; // Commas and colons
  if (token.match(/^\n+$/)) return 200; // Line breaks
  if (token.trim().length === 0) return 10; // Just whitespace
  if (token.trim().length > 15) return baseDelay + 30; // Longer words
  if (index < 3) return baseDelay + 50; // First few tokens (thinking time)
  
  // Add some randomness for natural feel
  const randomFactor = Math.random() * 30 - 15; // ±15ms
  return Math.max(20, baseDelay + randomFactor);
}

const normalizeLineEndings = (input: string): string => input.replace(/\r\n/g, '\n');

const isDividerLine = (line: string): boolean => /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim());

const extractHeading = (line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null => {
  const match = line.trim().match(/^(#{1,6})\s+(.*)$/);
  if (!match) {
    return null;
  }
  const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
  const text = match[2].trim();
  return { level, text };
};

const extractListItem = (line: string): { ordered: boolean; text: string } | null => {
  const trimmed = line.trim();
  const unordered = trimmed.match(/^[-*+]\s+(.*)$/);
  if (unordered) {
    return { ordered: false, text: unordered[1].trim() };
  }
  const ordered = trimmed.match(/^(\d+)\.\s+(.*)$/);
  if (ordered) {
    return { ordered: true, text: ordered[2].trim() };
  }
  return null;
};

const isCodeFence = (line: string): { language?: string } | null => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('```')) {
    return null;
  }
  const language = trimmed.slice(3).trim();
  return { language: language || undefined };
};

const isQuoteLine = (line: string): boolean => line.trim().startsWith('>');

const isParagraphBoundary = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  return (
    isDividerLine(trimmed) ||
    Boolean(extractHeading(trimmed)) ||
    Boolean(extractListItem(trimmed)) ||
    Boolean(isCodeFence(trimmed)) ||
    isQuoteLine(trimmed)
  );
};

const TABLE_DIVIDER_REGEX = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/;

const trimTableEdges = (line: string): string => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');

const splitTableRow = (line: string): string[] => {
  const cleaned = trimTableEdges(line.trim());
  return cleaned
    .split('|')
    .map((cell) => cell.replace(/\\\|/g, '|').trim());
};

interface ParsedTableResult {
  headers: string[];
  rows: string[][];
  nextIndex: number;
}

const tryParseTable = (lines: string[], startIndex: number): ParsedTableResult | null => {
  if (startIndex + 1 >= lines.length) {
    return null;
  }

  const headerLine = lines[startIndex];
  const dividerLine = lines[startIndex + 1];

  if (!headerLine.includes('|') || !TABLE_DIVIDER_REGEX.test(dividerLine)) {
    return null;
  }

  const headers = splitTableRow(headerLine);
  let nextIndex = startIndex + 2;
  const rows: string[][] = [];

  while (nextIndex < lines.length) {
    const candidate = lines[nextIndex];
    if (!candidate.trim() || !candidate.includes('|')) {
      break;
    }
    const cells = splitTableRow(candidate);
    rows.push(cells);
    nextIndex++;
  }

  if (headers.length === 0 || rows.length === 0) {
    return null;
  }

  return {
    headers,
    rows,
    nextIndex
  };
};

const TABLE_CAPTION_REGEX = /^(?:table|טבלה)\s*[:\-]\s*(.+)$/i;
const REPORT_BLOCK_REGEX = /^report\s*[:\-]\s*(\{[\s\S]*\})$/i;

export const hydrateMessagesWithParsedContent = (messages: Message[]): Message[] =>
  messages.map((message) => ({
    ...message,
    parsed: buildParsedMessageContent(message.content),
  }));

// Frontend streaming utilities
export class StreamingClient {
  private abortController: AbortController | null = null;

  // API streaming method with structured chunk handling
  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: StreamingTokenMetadata) => void,
    onComplete: (result: StreamingCompletionPayload) => void,
    onError: (error: Error) => void,
    baseUrl = 'http://localhost:3030',
    authToken?: string,
    chatId?: string,
    tools?: unknown[],
    dateFilter?: unknown,
    selectedCountries?: string[]
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      // Generate chat ID if not provided
      const requestChatId = chatId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare request with enhanced structure
      const requestBody = {
        chatId: requestChatId,
        auth: {
          token: authToken || '',
          userId: 'user_123456789' // Default for demo
        },
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          filterId: msg.filterId,
          filterSnapshot: msg.filterSnapshot
        })),
        tools: tools || [],
        dateFilter: dateFilter || null,
        selectedCountries: selectedCountries || [],
        requestTimestamp: new Date().toISOString(),
        clientInfo: {
          userAgent: (globalThis as { navigator?: { userAgent?: string } })?.navigator?.userAgent || 'Unknown',
          timestamp: Date.now()
        }
      };

      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = '';
        const markupBuilder = createStreamingMarkupBuilder();
        let latestParsed = markupBuilder.getCurrent();
        let completionMetadata: Record<string, unknown> | undefined;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              onComplete({
                content: latestParsed.plainText || '',
                parsed: latestParsed,
                metadata: completionMetadata,
                sessionId: completionMetadata?.sessionId as string | undefined,
              });
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const structuredChunk = JSON.parse(line);
                  
                  // Handle different chunk types
                  switch (structuredChunk.chunkType) {
                    case 'start':
                      markupBuilder.reset();
                      latestParsed = markupBuilder.getCurrent();
                      console.log('🚀 Stream started:', structuredChunk.data);
                      break;
                      
                    case 'metadata':
                      console.log('📊 Metadata:', structuredChunk.data);
                      break;
                      
                    case 'section':
                      // Handle section start/end events
                      console.log(`📦 Section ${structuredChunk.data.action}:`, structuredChunk.data.section);
                      break;
                      
                    case 'token':
                      // Send token to the UI
                      latestParsed = markupBuilder.append({
                        token: structuredChunk.data.token,
                        cumulativeContent: structuredChunk.data.cumulativeContent,
                      });

                      onToken(structuredChunk.data.token, {
                        ...structuredChunk.data,
                        timestamp: structuredChunk.timestamp,
                        sessionId: structuredChunk.sessionId,
                        parsed: latestParsed,
                        section: structuredChunk.data.section,
                        contentType: structuredChunk.data.contentType,
                      });
                      break;
                      
                    case 'progress':
                      console.log('⏳ Progress:', structuredChunk.data.progress + '%');
                      break;
                      
                    case 'complete':
                      console.log('✅ Stream completed:', structuredChunk.data);
                      completionMetadata = {
                        ...structuredChunk.data,
                        timestamp: structuredChunk.timestamp,
                        sessionId: structuredChunk.sessionId,
                      };
                      if (typeof structuredChunk.data.finalContent === 'string') {
                        latestParsed = markupBuilder.append({
                          cumulativeContent: structuredChunk.data.finalContent,
                        });
                      }
                      break;
                      
                    case 'error':
                      throw new Error(structuredChunk.data.error.message || 'Unknown streaming error');
                      
                    default:
                      console.warn('Unknown chunk type:', structuredChunk.chunkType);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('API stream was aborted');
      } else {
        onError(error instanceof Error ? error : new Error('Unknown API streaming error'));
      }
    }
  }
  
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

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
