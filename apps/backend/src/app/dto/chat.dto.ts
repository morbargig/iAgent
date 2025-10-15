import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsBoolean } from 'class-validator';

export class AuthTokenDto {
  @ApiProperty({
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_123456789'
  })
  @IsString()
  userId!: string;
}

export class ToolSelectionDto {
  @ApiProperty({
    description: 'Tool identifier',
    example: 'web_search'
  })
  @IsString()
  toolId!: string;

  @ApiProperty({
    description: 'Tool name',
    example: 'Web Search'
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Tool configuration parameters',
    example: { maxResults: 5, language: 'en' }
  })
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the tool is enabled',
    example: true
  })
  @IsBoolean()
  enabled!: boolean;
}

export class FileMetadataDto {
  @ApiProperty({
    description: 'Unique file identifier',
    example: 'file_1638360000000_abc123'
  })
  @IsString()
  fileId!: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf'
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  size!: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf'
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Chat ID this file belongs to',
    example: 'chat_1638360000000_xyz789'
  })
  @IsString()
  chatId!: string;

  @ApiPropertyOptional({
    description: 'Message ID this file belongs to',
    example: 'msg_1638360000000_abc123'
  })
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  @IsDateString()
  uploadedAt!: string;

  @ApiPropertyOptional({
    description: 'GridFS object ID (for MongoDB mode)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  gridfsId?: string;

  @ApiPropertyOptional({
    description: 'Base64 encoded file data (for demo mode)',
  })
  @IsOptional()
  @IsString()
  base64Data?: string;
}

export class ChatMessageDto {
  @ApiProperty({
    description: 'Unique identifier for the message',
    example: 'msg_1638360000000_abc123'
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant', 'system'],
    example: 'user'
  })
  @IsEnum(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! Can you help me with TypeScript?'
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'ISO timestamp when the message was created',
    example: '2024-01-01T12:00:00.000Z'
  })
  @IsDateString()
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Message metadata',
    example: {
      edited: false,
      tokenCount: 25,
      confidence: 0.95
    }
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Filter ID associated with this message',
    example: 'filter_1638360000000_def456'
  })
  @IsOptional()
  @IsString()
  filterId?: string;

  @ApiPropertyOptional({
    description: 'Filter configuration snapshot at time of message creation',
    example: {
      filterId: 'filter_1638360000000_def456',
      name: 'Filter 12/1/2024, 2:00:00 PM',
      config: {
        dateFilter: { type: 'custom', customRange: { amount: 1, type: 'months' } },
        selectedCountries: ['PS', 'LB'],
        enabledTools: ['web_search', 'document_analyzer']
      }
    }
  })
  @IsOptional()
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, any>;
  };

  @ApiPropertyOptional({
    description: 'File attachments associated with this message',
    type: [FileMetadataDto]
  })
  @IsOptional()
  @IsArray()
  files?: FileMetadataDto[];
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'Unique chat/conversation identifier',
    example: 'chat_1638360000000_xyz789'
  })
  @IsString()
  chatId!: string;

  @ApiProperty({
    description: 'User authentication token',
    type: AuthTokenDto
  })
  auth!: AuthTokenDto;

  @ApiProperty({
    description: 'Array of chat messages representing the conversation history',
    type: [ChatMessageDto],
    example: [
      {
        id: 'msg_1638360000000_abc123',
        role: 'user',
        content: 'Hello! Can you help me with TypeScript?',
        timestamp: '2024-01-01T12:00:00.000Z'
      }
    ]
  })
  @IsArray()
  messages!: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Selected tools for this conversation',
    type: [ToolSelectionDto],
    example: [
      {
        toolId: 'web_search',
        name: 'Web Search',
        enabled: true,
        parameters: { maxResults: 5 }
      }
    ]
  })
  @IsOptional()
  @IsArray()
  tools?: ToolSelectionDto[];

  @ApiPropertyOptional({
    description: 'Request timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  requestTimestamp?: string;

  @ApiPropertyOptional({
    description: 'Client information',
    example: {
      userAgent: 'Mozilla/5.0...',
      ip: '192.168.1.1',
      sessionId: 'session_123'
    }
  })
  @IsOptional()
  clientInfo?: Record<string, any>;
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