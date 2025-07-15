import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => {
  const projects = await getJestProjectsAsync();
  
  return {
    // Use projects from Nx
    projects,
    
    // Global test configuration
    collectCoverage: true,
    collectCoverageFrom: [
      'apps/**/*.{ts,tsx,js,jsx}',
      'libs/**/*.{ts,tsx,js,jsx}',
      '!**/*.d.ts',
      '!**/*.config.{js,ts}',
      '!**/*.spec.{ts,tsx,js,jsx}',
      '!**/*.test.{ts,tsx,js,jsx}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/coverage/**',
    ],
    
    // Coverage thresholds - fail tests if coverage is below these values
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      // Specific thresholds for critical files
      'apps/frontend/src/components/': {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      'apps/backend/src/': {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
    
    // Coverage output directory
    coverageDirectory: 'coverage',
    
    // Coverage reporters
    coverageReporters: [
      'text',           // Console output
      'text-summary',   // Brief summary
      'html',           // HTML report
      'lcov',           // For external tools like Codecov
      'json',           // JSON format
      'clover',         // XML format
    ],
    
    // Test results processor for better reporting
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      }],
      ['jest-html-reporters', {
        publicPath: './test-results',
        filename: 'test-report.html',
        openReport: false,
        pageTitle: 'iAgent Test Report',
        logoImgPath: undefined,
        hideIcon: false,
        expand: false,
        customInfos: [
          { title: 'Environment', value: process.env.NODE_ENV || 'test' },
          { title: 'Branch', value: process.env.GITHUB_REF_NAME || 'local' },
          { title: 'Commit', value: process.env.GITHUB_SHA || 'local' },
        ],
      }],
    ],
    
    // Test environment settings
    testEnvironment: 'node',
    
    // Timeout settings
    testTimeout: 10000,
    
    // Setup files to run before tests
    setupFilesAfterEnv: [
      '<rootDir>/jest.setup.ts',
    ],
    
    // Module name mapping for better imports
    moduleNameMapper: {
      '^@iagent/shared-types$': '<rootDir>/libs/shared-types/src/index.ts',
      '^@iagent/shared-utils$': '<rootDir>/libs/shared-utils/src/index.ts',
      '^@iagent/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    },
    
    // Files to ignore during testing
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/coverage/',
      '/.nx/',
    ],
    
    // Transform configuration
    transform: {
      '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
        tsconfig: '<rootDir>/tsconfig.base.json',
      }],
    },
    
    // File extensions to consider
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    
    // Automatically restore mock state between every test
    restoreMocks: true,
    
    // Automatically reset mock state between every test
    resetMocks: true,
    
    // Verbose output for debugging
    verbose: process.env.CI === 'true' || process.env.JEST_VERBOSE === 'true',
    
    // Bail on first test failure in CI
    bail: process.env.CI === 'true' ? 1 : 0,
    
    // Maximum number of concurrent workers
    maxWorkers: process.env.CI === 'true' ? 2 : '50%',
    
    // Global variables available in tests
    globals: {
      'ts-jest': {
        useESM: false,
        isolatedModules: true,
      },
    },
    
    // Error handling
    errorOnDeprecated: true,
    
    // Watch plugins for better development experience
    watchPlugins: [
      'jest-watch-typeahead/filename',
      'jest-watch-typeahead/testname',
    ],
  };
};
