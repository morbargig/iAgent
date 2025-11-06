import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatService } from './services/chat.service';
import { AuthService } from './auth/auth.service';

// Mock the problematic services to avoid decorator issues
const mockAppService = {
  getData: jest.fn().mockReturnValue({ 
    message: 'Hello API',
    status: 'ok',
    version: '1.0.0',
    uptime: 12345
  }),
  validateCredentials: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
  generateDemoToken: jest.fn().mockResolvedValue('demo-token-123'),
  generateAuthToken: jest.fn().mockResolvedValue('auth-token-123'),
};

const mockChatService = {
  processMessage: jest.fn().mockResolvedValue({
    id: 'msg-123',
    content: 'Test response',
    success: true
  }),
  createChat: jest.fn().mockResolvedValue({
    id: 'chat-123',
    title: 'Test Chat',
    success: true
  }),
  getChatHistory: jest.fn().mockResolvedValue([]),
};

const mockAuthService = {
  login: jest.fn().mockResolvedValue({
    token: 'test-token',
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    expiresIn: '24h'
  }),
  validateToken: jest.fn().mockResolvedValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'user',
    createdAt: new Date()
  }),
};

describe('AppController', () => {
  let app: TestingModule;
  let controller: AppController;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('getData', () => {
    it('should return API health information', () => {
      const result = controller.getData();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.version).toBe('1.0.0');
      expect(typeof result.uptime).toBe('number');
      expect(result.endpoints).toBeDefined();
      expect(result.endpoints.health).toBe('/api');
      expect(result.endpoints.docs).toBe('/api/docs');
    });
  });

  describe('health check', () => {
    it('should return health status', () => {
      const result = controller.getData();
      expect(result.status).toBe('ok');
      expect(result.version).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have access to app service', () => {
      expect(mockAppService).toBeDefined();
      expect(mockAppService.getData).toBeDefined();
    });
  });
});
