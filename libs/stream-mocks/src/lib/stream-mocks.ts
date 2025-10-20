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
  filterId?: string | null; // Associated filter ID
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, any>;
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
  const inputLower = input.toLowerCase();
  
  // PRIORITY: Check for report-related keywords FIRST and return specialized responses with report links
  if (inputLower.includes('security') || inputLower.includes('audit') || inputLower.includes('vulnerability')) {
    return `I have the latest security audit information for you. Here's our detailed [Q4 2024 Security Audit Report](report://security-audit-2024) that covers network security, application vulnerabilities, and compliance status.

**Key Highlights:**
- Network Security: ✅ Strong performance
- Application Security: ⚠️ 3 medium-priority vulnerabilities identified  
- Compliance: ✅ SOC 2, GDPR, and ISO 27001 standards met

The report includes specific recommendations for immediate actions and long-term improvements. Click the link above to view the full analysis with detailed findings and remediation steps.`;
  }
  
  if (inputLower.includes('performance') || inputLower.includes('metrics') || inputLower.includes('system') || inputLower.includes('monitoring')) {
    return `Here's our comprehensive [System Performance Analysis Report](report://performance-analysis-2024) showing system performance across all critical infrastructure components.

**Performance Overview:**
- Average Response Time: 120ms
- Database Query Time: 45ms (within target)
- System Throughput: 2,450 requests/second
- Error Rate: 0.02%

**Key Improvements:**
- 15% faster response times vs last quarter
- 22% throughput increase  
- 60% reduction in error rate

The report identifies specific bottlenecks and provides immediate, short-term, and long-term optimization recommendations. View the complete analysis by clicking the link above.`;
  }
  
  if (inputLower.includes('report') || inputLower.includes('analysis') || inputLower.includes('dashboard')) {
    return `I have access to detailed reports and analysis dashboards. Here are our latest reports:

📊 **Available Reports:**

1. [Q4 2024 Security Audit Report](report://security-audit-2024)
   - Comprehensive security assessment
   - Network, application, and compliance analysis
   - **Priority:** High | **Status:** Published

2. [System Performance Analysis Report](report://performance-analysis-2024)
   - System performance metrics and optimization
   - Infrastructure analysis and recommendations  
   - **Priority:** Medium | **Status:** Published

Click on any report link to view the full details, including metrics, findings, recommendations, and downloadable attachments. Each report includes detailed technical analysis and actionable insights.`;
  }
  
  // Fall back to translation-based responses only if no report keywords match
  const responses = MOCK_RESPONSES(t);
  
  if (inputLower.includes('hello') || inputLower.includes('hi')) {
    return responses.greeting;
  }
  
  if (inputLower.includes('technical') || inputLower.includes('programming')) {
    return responses.technical;
  }
  
  if (inputLower.includes('explain') || inputLower.includes('how does')) {
    return responses.explanation;
  }
  
  if (inputLower.includes('creative') || inputLower.includes('write')) {
    return responses.creative;
  }
  
  // For any other input, return a response with sample report links
  return `I can help you with various topics! Here are some sample reports you can explore:

📊 **Available Reports:**

1. [Q4 2024 Security Audit Report](report://security-audit-2024)
   - Click to view security analysis and compliance status

2. [System Performance Analysis Report](report://performance-analysis-2024)  
   - Click to view performance metrics and optimization recommendations

**Try asking about:**
- "security audit" - Get security-related information
- "system performance" - Get performance analysis
- "show me reports" - See all available reports

Click any report link above to open the detailed report panel!`;
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

  // API streaming method with structured chunk handling
  async streamChatAPI(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    baseUrl = 'http://localhost:3030',
    authToken?: string,
    chatId?: string,
    tools?: any[],
    dateFilter?: any,
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
          userAgent: (globalThis as any)?.navigator?.userAgent || 'Unknown',
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
                  const structuredChunk = JSON.parse(line);
                  
                  // Handle different chunk types
                  switch (structuredChunk.chunkType) {
                    case 'start':
                      console.log('🚀 Stream started:', structuredChunk.data);
                      break;
                      
                    case 'metadata':
                      console.log('📊 Metadata:', structuredChunk.data);
                      break;
                      
                    case 'token':
                      // Send token to the UI
                      onToken(structuredChunk.data.token, {
                        ...structuredChunk.data,
                        timestamp: structuredChunk.timestamp,
                        sessionId: structuredChunk.sessionId
                      });
                      break;
                      
                    case 'progress':
                      console.log('⏳ Progress:', structuredChunk.data.progress + '%');
                      break;
                      
                    case 'complete':
                      console.log('✅ Stream completed:', structuredChunk.data);
                      onComplete();
                      return;
                      
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
  
  // Combined method that uses flag to determine mode
  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    useMock = false,
    baseUrl = 'http://localhost:3030',
    t?: TranslationFunction,
    authToken?: string,
    chatId?: string,
    tools?: any[],
    dateFilter?: any,
    selectedCountries?: string[]
  ): Promise<void> {
    if (useMock) {
      if (!t) {
        throw new Error('Translation function is required for mock mode');
      }
      await this.streamChatMock(messages, onToken, onComplete, onError, t);
    } else {
      await this.streamChatAPI(messages, onToken, onComplete, onError, baseUrl, authToken, chatId, tools, dateFilter, selectedCountries);
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
    config?: Record<string, any>;
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
