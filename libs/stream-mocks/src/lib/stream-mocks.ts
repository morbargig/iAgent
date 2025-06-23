export function streamMocks(): string {
  return 'stream-mocks';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isInterrupted?: boolean; // Add flag to indicate if generation was stopped in the middle
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

type TranslationFunction = (key: string, params?: Record<string, string>) => string;

const MOCK_RESPONSES = (t: TranslationFunction) => ({
  greeting: t('mock.greeting'),
  technical: t('mock.technical'),
  explanation: t('mock.explanation'),
  creative: t('mock.creative'),
  default: (input: string) => t('mock.default', { input }),
});

export const generateMockResponse = (input: string, t: TranslationFunction): string => {
  const responses = MOCK_RESPONSES(t);
  
  if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
    return responses.greeting;
  }
  
  if (input.toLowerCase().includes('technical') || input.toLowerCase().includes('programming')) {
    return responses.technical;
  }
  
  if (input.toLowerCase().includes('explain') || input.toLowerCase().includes('how does')) {
    return responses.explanation;
  }
  
  if (input.toLowerCase().includes('creative') || input.toLowerCase().includes('write')) {
    return responses.creative;
  }
  
  return responses.default(input);
};

export const streamMockResponse = async (
  input: string,
  t: TranslationFunction,
  onChunk: (chunk: string) => void,
  onComplete: () => void
): Promise<void> => {
  const response = generateMockResponse(input, t);
  const chunks = response.split(' ');
  
  for (const chunk of chunks) {
    await new Promise(resolve => setTimeout(resolve, 50));
    onChunk(chunk + ' ');
  }
  
  onComplete();
};

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
  const baseDelay = 50;
  const randomFactor = Math.random() * 30;
  return Math.max(20, baseDelay + randomFactor);
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
export function calculateStreamingDelay(token: string, index: number, allTokens: string[]): number {
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

// Stream response generator for mock mode
export async function* generateStreamResponse(
  input: string,
  abortSignal?: AbortSignal,
  onProgress?: (progress: number, metadata: any) => void,
  t?: TranslationFunction
): AsyncGenerator<StreamTokenDto> {
  if (!t) {
    throw new Error('Translation function is required');
  }
  const response = generateMockResponse(input, t);
  const tokens = tokenizeResponse(response);
  const totalTokens = tokens.length;
  
  for (let i = 0; i < tokens.length; i++) {
    // Check if aborted before processing each token
    if (abortSignal?.aborted) {
      return;
    }
    
    const token = tokens[i];
    const delay = calculateStreamingDelay(token, i, tokens);
    
    // Simulate processing time with abort checking
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, delay);
      
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
    
    // Double-check abort status after delay
    if (abortSignal?.aborted) {
      return;
    }
    
    const progress = Math.round((i + 1) / totalTokens * 100);
    const metadata = {
      index: i + 1,
      total_tokens: totalTokens,
      timestamp: new Date().toISOString(),
      model: 'gpt-3.5-turbo-mock',
      processing_time_ms: delay,
      confidence: 0.85 + Math.random() * 0.15, // 0.85-1.0
      categories: ['general', 'helpful'],
      progress
    };
    
    if (onProgress) {
      onProgress(progress, metadata);
    }
    
    yield {
      token,
      done: i === tokens.length - 1,
      metadata
    };
  }
}

// Frontend streaming utilities
export class StreamingClient {
  private abortController: AbortController | null = null;
  
  // Mock streaming method
  async streamChatMock(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    t: TranslationFunction
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const lastMessage = messages[messages.length - 1];
      const response = generateMockResponse(lastMessage.content, t);
      const tokens = tokenizeResponse(response);
      
      for (let i = 0; i < tokens.length; i++) {
        // Check if aborted
        if (this.abortController?.signal.aborted) {
          console.log('Mock stream was aborted');
          return;
        }
        
        const token = tokens[i];
        const delay = calculateStreamingDelay(token, i, tokens);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const metadata = {
          index: i + 1,
          total_tokens: tokens.length,
          timestamp: new Date().toISOString(),
          model: 'gpt-3.5-turbo-mock',
          processing_time_ms: delay,
          confidence: 0.85 + Math.random() * 0.15,
          categories: ['general', 'helpful'],
          progress: Math.round(((i + 1) / tokens.length) * 100)
        };
        
        onToken(token, metadata);
      }
      
      onComplete();
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        console.log('Mock stream was aborted');
      } else {
        onError(error instanceof Error ? error : new Error('Unknown mock streaming error'));
      }
    } finally {
      this.abortController = null;
    }
  }

  // API streaming method
  async streamChatAPI(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    baseUrl = 'http://localhost:3000'
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        signal: this.abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              onComplete();
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const jsonChunk: StreamTokenDto = JSON.parse(line);
                  
                  if (jsonChunk.error) {
                    throw new Error(jsonChunk.error.message || 'Unknown streaming error');
                  }
                  
                  onToken(jsonChunk.token, jsonChunk.metadata);
                  
                  if (jsonChunk.done) {
                    onComplete();
                    return;
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
  
  // Combined method that uses flag to determine mode
  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    useMock = false,
    baseUrl = 'http://localhost:3000',
    t?: TranslationFunction
  ): Promise<void> {
    if (useMock) {
      if (!t) {
        throw new Error('Translation function is required for mock mode');
      }
      await this.streamChatMock(messages, onToken, onComplete, onError, t);
    } else {
      await this.streamChatAPI(messages, onToken, onComplete, onError, baseUrl);
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
  isStreaming = false
): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    isStreaming
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
export function validateChatRequest(request: any): ChatRequest {
  if (!request.messages || !Array.isArray(request.messages)) {
    throw new Error('Invalid request: messages array is required');
  }
  
  if (request.messages.length === 0) {
    throw new Error('Invalid request: at least one message is required');
  }
  
  return {
    messages: request.messages,
    model: request.model || 'gpt-3.5-turbo-mock',
    temperature: request.temperature || 0.7,
    max_tokens: request.max_tokens || 2048,
    stream: request.stream !== false
  };
}
