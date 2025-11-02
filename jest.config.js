/** @type {import('jest').Config} */
export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest/presets/default-esm',

  // Test environment
  testEnvironment: 'node',

  // Module resolution for ES modules
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform configuration for TypeScript with ES modules
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Roots to search for tests
  roots: ['<rootDir>/src'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts', // Entry point, tested via integration
  ],

  // Coverage thresholds
  // NOTE: Phase 2 progress - modularization and testing utility modules
  // Current coverage: Statements 14.11%, Branches 10.22%, Functions 17.18%, Lines 13.75%
  // After full Phase 2 refactoring, will increase to 80%+
  coverageThreshold: {
    global: {
      branches: 10,     // 103/1007 branches covered (up from 0%)
      functions: 17,    // 44/256 functions covered (up from 3%)
      lines: 13,        // 222/1614 lines covered (up from 2%)
      statements: 14,   // 231/1637 statements covered (up from 2%)
    },
  },

  // Coverage reporting
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],

  // Setup files
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Maximum workers for parallel execution
  maxWorkers: '50%',
};
