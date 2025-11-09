import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsBoolean, MinLength } from 'class-validator';

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
  parameters?: Record<string, unknown>;

  @ApiProperty({
    description: 'Whether the tool is enabled',
    example: true
  })
  @IsBoolean()
  enabled!: boolean;
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
  metadata?: Record<string, unknown>;

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
  clientInfo?: Record<string, unknown>;
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

export class UpdateChatNameDto {
  @ApiProperty({
    description: 'Readable chat name/title',
    example: 'Weekly Intelligence Brief'
  })
  @IsString()
  @MinLength(1)
  name!: string;
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

export class StreamSectionDto {
  @ApiProperty({
    description: 'Section type (reasoning, tool-t, tool-x, answer)',
    enum: ['reasoning', 'tool-t', 'tool-x', 'answer'],
    example: 'answer'
  })
  section!: 'reasoning' | 'tool-t' | 'tool-x' | 'answer';

  @ApiProperty({
    description: 'Content type within the section',
    enum: ['citation', 'table', 'report', 'markdown'],
    example: 'markdown'
  })
  contentType!: 'citation' | 'table' | 'report' | 'markdown';

  @ApiProperty({
    description: 'Content data (can be text, base64 JSON, etc.)',
    example: 'This is the content...'
  })
  content!: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the section',
    example: {
      toolId: 'tool-x',
      executionTime: 1500
    }
  })
  metadata?: Record<string, unknown>;
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

export class ToolSchemaPageOptionDto {
  @ApiProperty({
    description: 'Option value',
    example: 'news'
  })
  value!: string;

  @ApiProperty({
    description: 'Option label',
    example: 'News Articles'
  })
  label!: string;
}

export class ToolSchemaConfigurationFieldDto {
  @ApiPropertyOptional({
    description: 'Pages configuration field',
    example: {
      required: false,
      options: [
        { value: 'news', label: 'News Articles' },
        { value: 'academic', label: 'Academic Papers' }
      ]
    }
  })
  pages?: {
    required: boolean;
    options: ToolSchemaPageOptionDto[];
  };

  @ApiPropertyOptional({
    description: 'Required words configuration field',
    example: {
      required: false,
      placeholder: 'Enter keywords that must be present...'
    }
  })
  requiredWords?: {
    required: boolean;
    placeholder: string;
  };
}

export class ToolSchemaDto {
  @ApiProperty({
    description: 'Tool identifier',
    example: 'tool-x'
  })
  id!: string;

  @ApiProperty({
    description: 'Tool name',
    example: 'ToolT'
  })
  name!: string;

  @ApiProperty({
    description: 'Tool description',
    example: 'Web search tool for finding relevant information and sources'
  })
  description!: string;

  @ApiProperty({
    description: 'Whether the tool requires configuration',
    example: true
  })
  requiresConfiguration!: boolean;

  @ApiProperty({
    description: 'Configuration fields for the tool',
    type: ToolSchemaConfigurationFieldDto
  })
  configurationFields!: ToolSchemaConfigurationFieldDto;
} 