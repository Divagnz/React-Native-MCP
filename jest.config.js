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
  //  Coverage Thresholds (incrementally tighten as project matures)
  // ──────────────────────────────────────────────────────────────
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 35,
      lines: 35,
      statements: 35,
    },
    './src/utils/*.ts': {
      branches: 70,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    './src/tools/modules/utils/*': {
      branches: 10,
      functions: 10,
      lines: 15,
      statements: 10,
    },
    './src/tools/modules/services/*': {
      branches: 5,
      functions: 15,

      lines: 10,
      statements: 10,
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
