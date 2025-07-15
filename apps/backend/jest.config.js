/* eslint-disable */
module.exports = {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  displayName: '@iagent/backend',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.(ts|js)', '**/*.(test|spec).(ts|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: false,
      isolatedModules: false,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: '../../coverage/apps/backend',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testTimeout: 30000,
}; 