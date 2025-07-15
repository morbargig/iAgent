import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

// Global test configuration for backend (Node.js environment)
// This setup is for server-side testing only

// Ensure decorators work properly in tests
require('reflect-metadata');

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock setTimeout and setInterval for tests
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(30000);

// Mock process.env if needed
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Mock fetch for Node.js tests
global.fetch = jest.fn();

// Global test utilities
export const createMockResponse = (data: any, status = 200) => ({
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  status,
  ok: status >= 200 && status < 300,
  headers: new Map(),
});

export const createMockRequest = (data: any = {}) => ({
  body: data,
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user-id', email: 'test@example.com' },
});

// Mock data generators
export const generateTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const generateTestChat = () => ({
  id: 'test-chat-id',
  title: 'Test Chat',
  userId: 'test-user-id',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 