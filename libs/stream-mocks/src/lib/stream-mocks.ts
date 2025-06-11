export function streamMocks(): string {
  return 'stream-mocks';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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

// Mock responses for different types of queries
export const MOCK_RESPONSES = {
  greeting: `Hello! I'm an AI assistant created by Anthropic. I'm here to help you with a wide variety of tasks including:

- **Answering questions** on topics like science, history, current events, and more
- **Writing assistance** including essays, creative writing, and professional communications
- **Analysis and research** to help you understand complex topics
- **Programming help** with coding questions and debugging
- **Math and calculations** from basic arithmetic to advanced concepts
- **Creative projects** like brainstorming, storytelling, and ideation

I aim to be helpful, harmless, and honest in all my interactions. I can engage in nuanced conversations while being direct when needed.

What would you like to explore together today?`,

  technical: `I can definitely help you with technical topics! Here are some areas where I excel:

## Programming & Development
- **Languages**: Python, JavaScript, TypeScript, Java, C++, Rust, and many others
- **Web Development**: React, Vue, Angular, Node.js, Express, Next.js
- **Backend**: APIs, databases, microservices, serverless architecture
- **DevOps**: Docker, Kubernetes, CI/CD, cloud platforms (AWS, Azure, GCP)

## System Design & Architecture
- Scalable system design patterns
- Database design and optimization
- Performance tuning and monitoring
- Security best practices

## Data & AI
- Machine learning fundamentals
- Data analysis and visualization
- SQL and database optimization
- Statistics and data science concepts

I can help with code review, debugging, architecture decisions, or explaining complex technical concepts. What specific technical challenge are you working on?`,

  explanation: `Great question! Let me break this down in a clear and comprehensive way:

## Understanding the Concept

When we're dealing with complex topics, it's helpful to approach them systematically. Here's how I typically structure explanations:

### 1. **Core Principles**
First, I identify the fundamental concepts that underlie the topic. These are the building blocks that everything else is built upon.

### 2. **Context and Background**
Understanding where something comes from and why it exists helps create a mental framework for learning.

### 3. **Practical Applications**
Real-world examples make abstract concepts concrete and memorable.

### 4. **Common Misconceptions**
Addressing frequent misunderstandings helps avoid confusion and builds deeper comprehension.

## Key Benefits of This Approach

- **Clarity**: Breaking things down makes complex ideas accessible
- **Retention**: Structured learning improves long-term memory
- **Application**: Understanding principles enables creative problem-solving

Would you like me to apply this framework to a specific topic you're curious about? I'm here to help make any concept clearer!`,

  creative: `I'd love to help with your creative project! Creativity is one of my favorite areas to explore. Here are some ways I can assist:

## Writing & Storytelling
- **Fiction**: Character development, plot structures, dialogue writing
- **Poetry**: Various forms, meter, imagery, and wordplay
- **Screenwriting**: Scene construction, character arcs, formatting
- **Creative nonfiction**: Personal essays, memoirs, travel writing

## Brainstorming & Ideation
- **Concept development**: Turning vague ideas into concrete plans
- **World-building**: Creating rich, consistent fictional universes
- **Problem-solving**: Finding unique angles and fresh perspectives
- **Creative exercises**: Prompts and techniques to spark inspiration

## Content Creation
- **Blog posts and articles**: Engaging, informative content
- **Marketing copy**: Compelling messaging that resonates
- **Social media**: Creative posts that capture attention
- **Presentations**: Making complex information engaging

## Creative Collaboration

I can serve as a creative partner, offering:
- Fresh perspectives on your existing ideas
- Constructive feedback on drafts and concepts
- Alternative approaches when you're stuck
- Encouragement and motivation throughout the process

What type of creative project are you working on? I'm excited to help bring your vision to life!`
};

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

// Generate mock response based on input
export function generateMockResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return MOCK_RESPONSES.greeting;
  }
  
  if (lowerInput.includes('code') || lowerInput.includes('program') || lowerInput.includes('technical') || 
      lowerInput.includes('develop') || lowerInput.includes('api') || lowerInput.includes('database')) {
    return MOCK_RESPONSES.technical;
  }
  
  if (lowerInput.includes('explain') || lowerInput.includes('how') || lowerInput.includes('what') || 
      lowerInput.includes('why') || lowerInput.includes('understand')) {
    return MOCK_RESPONSES.explanation;
  }
  
  if (lowerInput.includes('write') || lowerInput.includes('creative') || lowerInput.includes('story') || 
      lowerInput.includes('idea') || lowerInput.includes('brainstorm')) {
    return MOCK_RESPONSES.creative;
  }
  
  // Default comprehensive response
  return `I understand you're asking about "${input}". Let me provide you with a comprehensive response that covers the key aspects of this topic.

## Key Points to Consider

When approaching this subject, there are several important factors to keep in mind:

- **Context matters**: Understanding the broader picture helps frame the specific details
- **Multiple perspectives**: Different viewpoints can provide valuable insights
- **Practical implications**: How this applies to real-world situations
- **Related concepts**: Connections to other ideas that might be relevant

## Detailed Analysis

Based on your question, I can see this touches on some interesting areas. The relationship between different elements here is quite nuanced, and it's worth exploring how they interact with each other.

There are both immediate considerations and longer-term implications to think about. The immediate aspects involve understanding the direct effects and responses, while the longer-term view helps us see patterns and trends that might not be obvious at first glance.

## Moving Forward

I'd be happy to dive deeper into any specific aspect of this topic that interests you most. Whether you're looking for:
- More detailed explanations of particular concepts
- Practical examples and applications
- Related topics that might be useful to explore
- Different approaches to thinking about this subject

Just let me know what direction you'd like to take this conversation, and I'll tailor my response accordingly!`;
}

// Stream response generator for mock mode
export async function* generateStreamResponse(
  input: string,
  abortSignal?: AbortSignal,
  onProgress?: (progress: number, metadata: any) => void
): AsyncGenerator<StreamTokenDto> {
  const response = generateMockResponse(input);
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
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Create abort controller for mock mode
      this.abortController = new AbortController();
      
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const input = lastUserMessage?.content || '';
      
      const generator = generateStreamResponse(input, this.abortController.signal);
      
      for await (const chunk of generator) {
        // Check if aborted
        if (this.abortController?.signal.aborted) {
          console.log('Mock stream was aborted');
          return;
        }
        
        if (chunk.error) {
          throw new Error(chunk.error.message || 'Unknown streaming error');
        }
        
        onToken(chunk.token, chunk.metadata);
        
        if (chunk.done) {
          onComplete();
          return;
        }
      }
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
    baseUrl = 'http://localhost:3000'
  ): Promise<void> {
    if (useMock) {
      await this.streamChatMock(messages, onToken, onComplete, onError);
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
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date(),
    isStreaming
  };
}

export function createStreamingMessage(role: 'user' | 'assistant'): Message {
  return createMessage(role, '', true);
}

export function updateMessageContent(message: Message, content: string, isStreaming = false): Message {
  return {
    ...message,
    content,
    isStreaming
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
