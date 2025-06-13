# Backend - AI Chat API

A robust NestJS-based backend API providing real-time streaming chat capabilities with comprehensive error handling and CORS support.

## 🚀 Features

- **Real-time Streaming**: Server-Sent Events (SSE) for token-by-token response streaming
- **RESTful API**: Clean, well-documented API endpoints
- **CORS Support**: Configured for cross-origin requests from frontend
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Health Monitoring**: Built-in health check endpoints
- **Development Ready**: Hot reload and comprehensive logging

## 🛠️ Tech Stack

- **NestJS** - Enterprise-grade Node.js framework
- **TypeScript** - Type-safe server-side development
- **Express** - HTTP server foundation
- **Server-Sent Events** - Real-time streaming protocol
- **Class Validator** - Request validation and transformation

## 🏗️ Architecture

```
src/
├── app/
│   ├── app.controller.ts    # Main application controller
│   ├── app.module.ts        # Root application module
│   └── app.service.ts       # Application services
├── chat/
│   ├── chat.controller.ts   # Chat endpoints and streaming logic
│   ├── chat.module.ts       # Chat module configuration
│   ├── chat.service.ts      # Chat business logic
│   └── dto/                 # Data Transfer Objects
│       ├── chat-request.dto.ts
│       └── stream-token.dto.ts
├── common/
│   ├── filters/             # Exception filters
│   ├── guards/              # Authentication guards
│   ├── interceptors/        # Request/response interceptors
│   └── pipes/               # Validation pipes
└── main.ts                  # Application bootstrap
```

## 🌐 API Endpoints

### Chat Streaming
```http
POST /api/chat/stream
Content-Type: application/json

{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Response**: Server-Sent Events stream
```
data: {"token": "Hello", "done": false, "metadata": {...}}
data: {"token": " there!", "done": false, "metadata": {...}}
data: {"token": "", "done": true, "metadata": {...}}
```

### Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 12345,
  "version": "1.0.0"
}
```

## 🔧 Data Transfer Objects

### ChatRequestDto
```typescript
export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}
```

### MessageDto
```typescript
export class MessageDto {
  @IsString()
  id: string;

  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  timestamp: string;
}
```

### StreamTokenDto
```typescript
export class StreamTokenDto {
  @IsString()
  token: string;

  @IsBoolean()
  done: boolean;

  @IsOptional()
  @IsObject()
  metadata?: {
    index?: number;
    total_tokens?: number;
    timestamp?: string;
    model?: string;
    processing_time_ms?: number;
    confidence?: number;
    categories?: string[];
  };

  @IsOptional()
  @IsObject()
  error?: {
    message: string;
    code?: string;
  };
}
```

## 🚦 Development

### Start Development Server
```bash
npx nx serve backend
# or
npm run dev:backend
```

### Build for Production
```bash
npx nx build backend
```

### Run Tests
```bash
npx nx test backend
```

### Lint Code
```bash
npx nx lint backend
```

### Watch Mode
```bash
npx nx serve backend --watch
```

## 🔧 Configuration

### Environment Variables
```bash
# .env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200

# AI Service Configuration (when implementing real AI)
OPENAI_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here
```

### CORS Configuration
```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## 🔄 Streaming Implementation

### Server-Sent Events Setup
```typescript
@Post('stream')
async streamChat(
  @Body() chatRequest: ChatRequestDto,
  @Res() response: Response,
): Promise<void> {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Streaming logic here
  for await (const token of this.chatService.generateResponse(chatRequest)) {
    response.write(`data: ${JSON.stringify(token)}\n\n`);
  }

  response.end();
}
```

### Error Handling
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : 500;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message || 'Internal server error',
    });
  }
}
```

## 🔌 AI Service Integration

### OpenAI Integration Example
```typescript
import { OpenAI } from 'openai';

@Injectable()
export class ChatService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async *generateResponse(request: ChatRequestDto) {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: request.messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      
      yield new StreamTokenDto({
        token,
        done,
        metadata: {
          model: chunk.model,
          timestamp: new Date().toISOString(),
        }
      });
    }
  }
}
```

### Anthropic Integration Example
```typescript
import { Anthropic } from '@anthropic-ai/sdk';

@Injectable()
export class ChatService {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  async *generateResponse(request: ChatRequestDto) {
    const stream = this.anthropic.messages.stream({
      model: 'claude-3-sonnet-20240229',
      messages: request.messages,
      max_tokens: 2048,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield new StreamTokenDto({
          token: event.delta.text,
          done: false,
        });
      }
    }

    yield new StreamTokenDto({ token: '', done: true });
  }
}
```

## 🧪 Testing

### Unit Tests
```typescript
describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [ChatService],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  it('should stream chat responses', async () => {
    const mockResponse = { writeHead: jest.fn(), write: jest.fn(), end: jest.fn() };
    const request = { messages: [{ role: 'user', content: 'Hello' }] };
    
    await controller.streamChat(request, mockResponse as any);
    
    expect(mockResponse.writeHead).toHaveBeenCalled();
    expect(mockResponse.write).toHaveBeenCalled();
    expect(mockResponse.end).toHaveBeenCalled();
  });
});
```

### Integration Tests
```bash
# Run e2e tests
npm run test:e2e

# Test specific endpoint
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/apps/backend ./

EXPOSE 3000

CMD ["node", "main.js"]
```

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

# Database (when implemented)
DATABASE_URL=postgresql://user:password@host:port/database

# AI Service
OPENAI_API_KEY=your_production_key
```

### Health Checks
```bash
# Docker health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## 🐛 Debugging

### Logging
```typescript
import { Logger } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  @Post('stream')
  async streamChat(@Body() request: ChatRequestDto) {
    this.logger.log(`Streaming chat with ${request.messages.length} messages`);
    // Implementation
  }
}
```

### Common Issues

**Port Already in Use:**
```bash
npx kill-port 3000
npx nx serve backend
```

**CORS Errors:**
```typescript
// Ensure CORS is properly configured in main.ts
app.enableCors({
  origin: true, // or specific origins
  credentials: true,
});
```

**Streaming Issues:**
```typescript
// Ensure proper headers for SSE
response.writeHead(200, {
  'Content-Type': 'text/plain',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
});
```

## 📊 Performance

### Monitoring
- **Response Times**: Track streaming latency
- **Memory Usage**: Monitor for memory leaks in long connections
- **Connection Count**: Track concurrent streaming connections
- **Error Rates**: Monitor failed requests and streaming errors

### Optimization
- **Connection Pooling**: Reuse HTTP connections
- **Compression**: Enable gzip compression
- **Caching**: Cache responses where appropriate
- **Rate Limiting**: Implement rate limiting for production

## 🔒 Security

### Authentication (Future Enhancement)
```typescript
@UseGuards(JwtAuthGuard)
@Post('stream')
async streamChat(@Req() req: Request) {
  const user = req.user;
  // Implementation with user context
}
```

### Validation
```typescript
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Post('stream')
async streamChat(@Body() request: ChatRequestDto) {
  // Validated request
}
```

## 🤝 Contributing

### Development Guidelines
1. **TypeScript**: Use strict typing for all services and controllers
2. **NestJS Patterns**: Follow NestJS architectural patterns
3. **Error Handling**: Implement comprehensive error handling
4. **Testing**: Write unit and integration tests
5. **Documentation**: Update OpenAPI/Swagger documentation

### Code Style
- **ESLint**: Follow NestJS linting rules
- **Prettier**: Auto-format code
- **Naming**: Use descriptive names for services and methods
- **DTOs**: Validate all input/output with DTOs

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Express.js Documentation](https://expressjs.com)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Part of the iAgent monorepo - Built with NestJS + TypeScript** 