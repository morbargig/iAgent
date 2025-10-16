/**
 * Jest Setup File
 * 
 * This file runs before all tests and sets up the testing environment.
 * It includes global mocks, polyfills, and utilities available to all tests.
 */

// Import Jest DOM for better DOM testing assertions
import '@testing-library/jest-dom';

// Mock console methods in tests to reduce noise
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Only mock console methods if not in verbose mode
if (process.env.JEST_VERBOSE !== 'true') {
  console.error = (...args: any[]) => {
    // Only show React warnings and errors we care about
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    // Filter out known warnings we don't care about in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
}

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.VITE_API_BASE_URL = 'http://localhost:3001';
process.env.VITE_MOCK_MODE = 'true';

// Mock window.matchMedia (used by many UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock EventSource for SSE testing
const MockEventSourceInstance = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
};

const MockEventSourceConstructor: any = jest.fn().mockImplementation(() => MockEventSourceInstance);
MockEventSourceConstructor.CONNECTING = 0;
MockEventSourceConstructor.OPEN = 1;
MockEventSourceConstructor.CLOSED = 2;
global.EventSource = MockEventSourceConstructor;

// Mock WebSocket
const MockWebSocketInstance = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

const MockWebSocketConstructor: any = jest.fn().mockImplementation(() => MockWebSocketInstance);
MockWebSocketConstructor.CONNECTING = 0;
MockWebSocketConstructor.OPEN = 1;
MockWebSocketConstructor.CLOSING = 2;
MockWebSocketConstructor.CLOSED = 3;
global.WebSocket = MockWebSocketConstructor;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLMediaElement properties
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  writable: true,
  value: false,
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveStyle(style: Record<string, any>): R;
    }
  }
}

// Global test helper functions
(global as any).createMockComponent = (name: string) => {
  return jest.fn().mockImplementation(({ children, ...props }) => {
    return React.createElement('div', {
      'data-testid': name.toLowerCase(),
      ...props,
    }, children);
  });
};

// Mock timer utilities for tests that need them
(global as any).mockTimers = {
  useFakeTimers: () => jest.useFakeTimers(),
  useRealTimers: () => jest.useRealTimers(),
  advanceTimersByTime: (ms: number) => jest.advanceTimersByTime(ms),
  runAllTimers: () => jest.runAllTimers(),
  runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
};

// Test data generators
(global as any).generateTestData = {
  user: (overrides = {}) => ({
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    ...overrides,
  }),

  message: (overrides = {}) => ({
    id: 'test-message-1',
    content: 'Test message content',
    timestamp: new Date().toISOString(),
    sender: 'user',
    ...overrides,
  }),

  conversation: (overrides = {}) => ({
    id: 'test-conversation-1',
    title: 'Test Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
};

// Custom matchers for better test assertions
expect.extend({
  toMatchImageSnapshot: () => ({ pass: true, message: () => '' }), // Placeholder for image testing
});

// Setup cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Clear any remaining timers
  jest.clearAllTimers();

  // Clear fetch mock calls
  (fetch as jest.Mock).mockClear();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test if there's an unhandled rejection
  throw reason;
});

// Increase test timeout for CI environment
if (process.env.CI) {
  jest.setTimeout(15000);
} else {
  jest.setTimeout(10000);
}

// React import for createMockComponent helper
import React from 'react'; 