// eslint.config.js (flat config)
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';

export default [
  {
    ignores: [
      'build/**',
      'coverage/**',
      'node_modules/**',
      '*.js',
      '!eslint.config.js',
      // If you have a JS Jest config, don’t ignore it:
      '!jest.config.js',
    ],
  },

  eslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'error',
      'comma-dangle': ['error', 'only-multiline'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'indent': ['error', 2, { SwitchCase: 1 }],
    },
  },

  // Tests: enable Jest plugin, globals, and block .skip/.only
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', project: null },
      globals: {
        ...globals.jest,   // <- gives describe/it/expect etc.
        ...globals.node,
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      // Allow looser TS rules in tests if you want:
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      'no-console': 'off',

      // Block skipped/focused tests:
      'jest/no-disabled-tests': 'error',  // disallows .skip
      'jest/no-focused-tests': 'error',   // disallows .only
      'jest/valid-expect': 'error',
    },
  },
];
