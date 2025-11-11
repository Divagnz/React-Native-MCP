/** @type {import('jest').Config} */
export default {
  // ──────────────────────────────────────────────────────────────
  //  TypeScript + ESM Support
  // ──────────────────────────────────────────────────────────────
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // '^@/(.*)$': '<rootDir>/src/$1', // enable if you use path aliases
  },

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
        diagnostics: { warnOnly: false },
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  //  Test Discovery
  // ──────────────────────────────────────────────────────────────
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/coverage/'],

  // ──────────────────────────────────────────────────────────────
  //  Coverage Collection
  // ──────────────────────────────────────────────────────────────
  collectCoverage: true,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/types.ts',
    '!src/**/index.ts', // barrel/entrypoints excluded for now
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],

  // ──────────────────────────────────────────────────────────────
  //  Coverage Thresholds (v0.1.0 - Raised based on actual coverage)
  // ──────────────────────────────────────────────────────────────
  coverageThreshold: {
    // Global thresholds raised significantly (actual: 52.4% lines, 64.63% functions, 90.57% branches)
    global: {
      branches: 85,      // was 25, actual 90.57% - set ambitious target (5% buffer)
      functions: 50,     // was 35, actual 64.63% - set below current (52% actual with tool impls)
      lines: 50,         // was 35, actual 52.4% - set slightly below current
      statements: 50,    // was 35, actual 52.4% - set slightly below current
    },

    // Utils directory has excellent coverage - raise to match actual performance
    './src/utils/*.ts': {
      branches: 85,      // was 70, actual 89-98% across files
      functions: 90,     // was 80, actual 90-100% across files
      lines: 90,         // was 85, actual 92-99% across files
      statements: 90,    // was 85, actual 92-99% across files
    },

    // Module utils directory also has excellent coverage
    './src/tools/modules/utils/*': {
      branches: 80,      // was 10, actual 86-100%
      functions: 100,    // was 10, actual 100% on both files
      lines: 90,         // was 15, actual 94-100%
      statements: 90,    // was 10, actual 94-100%
    },

    // Module services need improvement - minimum thresholds set just below current minimums
    // Note: Most services below 25% floor, will enforce 25%+ after adding more tests in v0.1.0
    './src/tools/modules/services/*': {
      branches: 55,      // was 5, ranges 55-100%
      functions: 16,     // was 15, below 25% floor (actual minimum: 16.66%), will raise to 25%+ in v0.1.0
      lines: 12,         // was 10, well below 25% floor (actual minimum: 12.03%), will raise to 25%+ in v0.1.0
      statements: 12,    // was 10, well below 25% floor (actual minimum: 12.03%), will raise to 25%+ in v0.1.0
    },

    // Expo core modules have strong coverage - raise significantly
    './src/tools/expo/core/**/*.ts': {
      branches: 79,      // was 50, actual 79-93% - set to minimum (expo-executor)
      functions: 85,     // was 60, actual 85-100% - set to minimum (expo-executor)
      lines: 80,         // was 60, actual 80-95% - set to minimum (expo-executor)
      statements: 80,    // was 60, actual 80-95% - set to minimum (expo-executor)
    },

    // Tool implementations need integration tests - temporarily below 25% floor
    // These are excluded from enforcement until integration tests are added
    // Target for v0.1.0: Add integration tests, then enforce 25% minimum (40%+ target)
    './src/tools/expo/!(core)/**/*.ts': {
      branches: 0,       // TODO v0.1.0: Add integration tests, enforce 25% minimum (target 30%)
      functions: 0,      // TODO v0.1.0: Add integration tests, enforce 25% minimum (target 40%)
      lines: 0,          // TODO v0.1.0: Add integration tests, enforce 25% minimum (target 40%)
      statements: 0,     // TODO v0.1.0: Add integration tests, enforce 25% minimum (target 40%)
    },
  },

  // ──────────────────────────────────────────────────────────────
  //  Behavior & Debugging
  // ──────────────────────────────────────────────────────────────
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: '50%',
  // detectOpenHandles: true, // uncomment for debugging hanging tests

  // ──────────────────────────────────────────────────────────────
  //  Optional setup file (uncomment if you add one)
  // ──────────────────────────────────────────────────────────────
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
