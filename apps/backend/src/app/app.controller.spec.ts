import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatService } from './services/chat.service';

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
        ],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getData', () => {
    it('should return API information', () => {
      const result = controller.getData();
      expect(result).toBeDefined();
      expect(result.message).toBe('Hello API');
      expect(result.status).toBe('ok');
      expect(mockAppService.getData).toHaveBeenCalled();
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
