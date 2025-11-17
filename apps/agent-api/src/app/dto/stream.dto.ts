import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsBoolean } from 'class-validator';
import type { Message } from '@iagent/chat-types';

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
    description: 'Filter ID associated with this message',
    example: 'filter_1638360000000_def456'
  })
  @IsOptional()
  @IsString()
  filterId?: string;

  @ApiPropertyOptional({
    description: 'Filter configuration snapshot at time of message creation',
  })
  @IsOptional()
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config?: Record<string, unknown>;
  };
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
  })
  @IsArray()
  messages!: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Array of tools to use for this request',
  })
  @IsOptional()
  @IsArray()
  tools?: unknown[];

  @ApiPropertyOptional({
    description: 'Date filter configuration',
  })
  @IsOptional()
  dateFilter?: unknown;

  @ApiPropertyOptional({
    description: 'Selected countries',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  selectedCountries?: string[];

  @ApiPropertyOptional({
    description: 'Request timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  requestTimestamp?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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
  parameters?: Record<string, unknown>;

  @ApiProperty({
    description: 'Whether the tool is enabled',
    example: true
  })
  @IsBoolean()
  enabled!: boolean;
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

  @ApiPropertyOptional({
    description: 'Error information if streaming failed',
  })
  error?: {
    message: string;
    code?: string;
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

