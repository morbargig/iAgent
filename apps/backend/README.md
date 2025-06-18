# 🚀 iAgent Backend

A robust NestJS API server providing AI chat functionality with real-time streaming, comprehensive documentation, and production-ready features.

## ✨ Features

- 🔄 **Real-time Streaming**: Server-Sent Events for live AI responses
- 📚 **Swagger Documentation**: Auto-generated API documentation
- 🛡️ **Type Safety**: Full TypeScript implementation with validation
- 🔧 **Modular Architecture**: Clean, maintainable NestJS structure
- 🌐 **CORS Support**: Cross-origin resource sharing enabled
- 📊 **Request Validation**: DTO validation with class-validator
- 🎯 **Mock Mode**: Built-in mock responses for development
- 🔍 **Debugging**: Comprehensive logging and error handling

## 🛠️ Tech Stack

- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Express** - Fast, unopinionated web framework
- **Swagger/OpenAPI** - API documentation and testing
- **Class Validator** - DTO validation and transformation
- **RxJS** - Reactive programming for streams

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:prod` - Build with production optimizations
- `npm run start` - Start production server
- `npm run start:dev` - Start development server
- `npm run start:debug` - Start with debugging enabled
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── app.controller.ts      # Main application controller
├── app.module.ts          # Root application module
├── app.service.ts         # Core application service
├── main.ts               # Application entry point
├── dto/                  # Data Transfer Objects
│   └── chat.dto.ts      # Chat request/response DTOs
├── interfaces/           # TypeScript interfaces
│   └── chat.interface.ts # Chat-related interfaces
├── services/            # Business logic services
│   └── streaming.service.ts # Streaming functionality
└── utils/               # Utility functions
    └── mock-responses.ts # Mock data for development
```

## 🔌 API Endpoints

### Base URL
- **Development**: `http://localhost:3000/api`
- **Documentation**: `http://localhost:3000/api/docs`

### Endpoints

#### GET `/api`
Health check endpoint
```json
{
  "message": "iAgent API is running!",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/chat`
Standard chat endpoint (non-streaming)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

#### POST `/api/chat/stream`
Streaming chat endpoint with Server-Sent Events
```json
{
  "messages": [
    {
      "role": "user", 
      "content": "Tell me a story"
    }
  ]
}
```

#### GET `/api/chat/sse-stream`
Server-Sent Events endpoint for real-time streaming

## 📊 Data Transfer Objects

### ChatMessageDto
```typescript
export class ChatMessageDto {
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role: 'user' | 'assistant' | 'system';

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
```

### ChatRequestDto
```typescript
export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
```

## 🔄 Streaming Implementation

### Server-Sent Events
The backend implements real-time streaming using Server-Sent Events (SSE):

```typescript
@Post('stream')
async streamChat(@Body() chatRequest: ChatRequestDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Stream implementation
  const stream = this.streamingService.createStream(chatRequest.messages);
  
  stream.subscribe({
    next: (chunk) => res.write(`data: ${JSON.stringify(chunk)}\n\n`),
    complete: () => res.end(),
    error: (error) => res.write(`data: ${JSON.stringify({ error })}\n\n`)
  });
}
```

### Mock Responses
Built-in mock responses for development and testing:

```typescript
const MOCK_RESPONSES = {
  greeting: "Hello! I'm an AI assistant...",
  help: "I can help you with various tasks...",
  story: "Once upon a time, in a digital realm...",
  code: "Here's a simple example:\n\n```javascript\n...",
  default: "I understand you're asking about..."
};
```

## 🛡️ Validation & Security

### Request Validation
- **DTO Validation**: All requests validated using class-validator
- **Type Safety**: Full TypeScript implementation
- **Sanitization**: Input sanitization and validation

### CORS Configuration
```typescript
app.enableCors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

## 📚 API Documentation

### Swagger/OpenAPI
Comprehensive API documentation available at `/api/docs`

Features:
- **Interactive Testing**: Test endpoints directly from docs
- **Schema Definitions**: Complete request/response schemas
- **Authentication**: API key and bearer token support
- **Examples**: Real request/response examples

### Generate Documentation
```bash
# Documentation is auto-generated from decorators
# Access at http://localhost:3000/api/docs
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### End-to-End Tests
```bash
# Run e2e tests
npm run test:e2e
```

### Test Structure
```
test/
├── app.e2e-spec.ts       # End-to-end tests
├── chat.controller.spec.ts # Controller tests
├── streaming.service.spec.ts # Service tests
└── utils/                # Test utilities
```

## 🔧 Configuration

### Environment Variables
```bash
# .env
PORT=3000
NODE_ENV=development
API_VERSION=1.0.0
CORS_ORIGIN=http://localhost:4200
```

### NestJS Configuration
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('iAgent API')
    .setDescription('AI Chat API with streaming support')
    .setVersion('1.0')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
```

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/apps/backend/main.js"]
```

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=3000
API_VERSION=1.0.0
```

## 🔍 Debugging

### Development Debugging
```bash
# Start with debugging
npm run start:debug

# Debug port: 9229
# VS Code: Attach to Node.js process
```

### Logging
```typescript
import { Logger } from '@nestjs/common';

export class AppService {
  private readonly logger = new Logger(AppService.name);

  async processRequest() {
    this.logger.log('Processing request...');
    this.logger.error('Error occurred', error.stack);
  }
}
```

## 📊 Performance

### Optimization Features
- **Streaming**: Efficient real-time data streaming
- **Validation Pipes**: Request validation without performance impact
- **Async/Await**: Non-blocking operations
- **Connection Pooling**: Efficient resource management

### Monitoring
```typescript
// Add performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

## 🤝 Contributing

### Development Guidelines
1. **Follow NestJS conventions**: Use decorators and dependency injection
2. **Add tests**: Unit tests for services, e2e tests for controllers
3. **Document APIs**: Use Swagger decorators for documentation
4. **Validate inputs**: Use DTOs with class-validator
5. **Handle errors**: Proper error handling and logging

### Code Style
- **ESLint**: Follow configured linting rules
- **Prettier**: Auto-format code on save
- **TypeScript**: Strict typing for all functions
- **Naming**: Use descriptive names following NestJS conventions

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Swagger/OpenAPI](https://swagger.io/docs)
- [RxJS Documentation](https://rxjs.dev)
- [Class Validator](https://github.com/typestack/class-validator)

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 