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
  // NOTE: Starting at minimal thresholds due to monolithic 4,779-line tools file
  // Phase 1 focuses on testing infrastructure and registration logic
  // Will increase to 80%+ after Phase 2 refactoring when code is modularized
  coverageThreshold: {
    global: {
      branches: 0,      // No branch coverage yet (registration only)
      functions: 3,     // 7/218 functions (registration methods)
      lines: 2,         // 29/1404 lines (registration calls)
      statements: 2,    // 29/1433 statements (registration calls)
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
