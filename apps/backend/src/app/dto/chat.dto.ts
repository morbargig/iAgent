import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'Unique identifier for the message',
    example: '1638360000000',
    required: false
  })
  id?: string;

  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant'],
    example: 'user'
  })
  role!: 'user' | 'assistant';

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! Can you help me with TypeScript?'
  })
  content!: string;

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: '2024-01-01T12:00:00.000Z',
    required: false
  })
  timestamp?: any;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'Array of chat messages representing the conversation history',
    type: [ChatMessageDto],
    example: [
      {
        id: '1638360000000',
        role: 'user',
        content: 'Hello! Can you help me with TypeScript?',
        timestamp: '2024-01-01T12:00:00.000Z'
      }
    ]
  })
  messages!: ChatMessageDto[];
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'The AI assistant response content',
    example: 'Hello! I\'d be happy to help you with TypeScript. What specific topic would you like to learn about?'
  })
  content!: string;

  @ApiPropertyOptional({
    description: 'Response metadata',
    example: {
      model: 'chatgpt-clone-v1',
      tokens: 25,
      processing_time: 1500
    }
  })
  metadata?: {
    model: string;
    tokens: number;
    processing_time: number;
  };
}

export class StreamTokenDto {
  @ApiProperty({
    description: 'The current token/word being streamed',
    example: 'Hello'
  })
  token!: string;

  @ApiProperty({
    description: 'Whether the streaming is complete',
    example: false
  })
  done!: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the token',
    example: {
      index: 5,
      total_tokens: 150
    }
  })
  metadata?: {
    index: number;
    total_tokens: number;
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed'
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Detailed error information',
    example: ['messages.0.content should not be empty']
  })
  details?: string[];

  @ApiProperty({
    description: 'Error type',
    example: 'ValidationError'
  })
  error!: string;

  @ApiProperty({
    description: 'Request timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  timestamp!: string;
}

export class HealthCheckDto {
  @ApiProperty({
    description: 'Service status',
    example: 'ok'
  })
  status!: string;

  @ApiProperty({
    description: 'Service version',
    example: '1.0.0'
  })
  version!: string;

  @ApiProperty({
    description: 'Uptime in seconds',
    example: 3600
  })
  uptime!: number;

  @ApiProperty({
    description: 'Available endpoints',
    example: {
      chat: '/api/chat',
      stream: '/api/chat/stream',
      sse: '/api/chat/sse-stream'
    }
  })
  endpoints!: Record<string, string>;
} 