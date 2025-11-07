/**
 * Tests for ExpoExecutor
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExpoExecutor } from '../expo-executor.js';

// Mock child_process
jest.mock('child_process');

describe('ExpoExecutor', () => {
  let executor: ExpoExecutor;
  let mockSpawn: jest.Mock;

  beforeEach(() => {
    executor = ExpoExecutor.getInstance();

    const childProcess = require('child_process');
    mockSpawn = childProcess.spawn as jest.Mock;

    // Default mock implementation
    mockSpawn.mockReturnValue({
      stdout: {
        on: jest.fn((event: string, handler: (data: Buffer) => void) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from('test output')), 10);
          }
        }),
      },
      stderr: {
        on: jest.fn((event: string, handler: (data: Buffer) => void) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from('')), 10);
          }
        }),
      },
      stdin: {
        write: jest.fn(),
        end: jest.fn(),
      },
      on: jest.fn((event: string, handler: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 20);
        }
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = ExpoExecutor.getInstance();
      const instance2 = ExpoExecutor.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('executeExpo', () => {
    it('should execute expo command successfully', async () => {
      const result = await executor.executeExpo(['start']);

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test output');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command failure', async () => {
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event: string, handler: (data: Buffer) => void) => {
            if (event === 'data') {
              setTimeout(() => handler(Buffer.from('error message')), 10);
            }
          }),
        },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') {
            setTimeout(() => handler(1), 20);
          }
        }),
      });

      const result = await executor.executeExpo(['invalid']);

      expect(result.success).toBe(false);
      expect(result.stderr).toBe('error message');
      expect(result.exitCode).toBe(1);
    });

    it('should handle process errors', async () => {
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, handler: (error: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('spawn error')), 10);
          }
        }),
      });

      const result = await executor.executeExpo(['start']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('spawn error');
    });

    // Note: Timeout testing is complex with mocked child_process and would require
    // real timers which makes the test slow. The timeout logic is verified manually
    // and through integration tests.
  });

  describe('executeEAS', () => {
    it('should execute EAS command', async () => {
      const result = await executor.executeEAS(['build', '--platform', 'ios']);

      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['eas', 'build', '--platform', 'ios']),
        expect.any(Object)
      );
    });
  });

  describe('sanitizeCommand', () => {
    it('should remove dangerous characters', async () => {
      await executor.executeExpo(['start', '--port;rm -rf /', '3000']);

      const calls = mockSpawn.mock.calls[0];
      const args = calls[1] as string[];

      expect(args.join(' ')).not.toContain(';');
      // Semicolon is removed but text remains (dangerous commands are sanitized, not filtered)
      expect(args.join(' ')).toContain('rm -rf');
    });

    it('should remove pipe characters', async () => {
      await executor.executeExpo(['start', '| cat /etc/passwd']);

      const calls = mockSpawn.mock.calls[0];
      const args = calls[1] as string[];

      expect(args.join(' ')).not.toContain('|');
    });

    it('should remove backticks', async () => {
      await executor.executeExpo(['start', '`whoami`']);

      const calls = mockSpawn.mock.calls[0];
      const args = calls[1] as string[];

      expect(args.join(' ')).not.toContain('`');
    });
  });

  describe('validatePackageName', () => {
    it('should accept valid package names', () => {
      expect(executor.validatePackageName('react-native')).toBe(true);
      expect(executor.validatePackageName('@expo/vector-icons')).toBe(true);
      expect(executor.validatePackageName('lodash_test')).toBe(true);
    });

    it('should reject invalid package names', () => {
      expect(executor.validatePackageName('package;rm -rf /')).toBe(false);
      expect(executor.validatePackageName('package|cat')).toBe(false);
      expect(executor.validatePackageName('package`whoami`')).toBe(false);
    });
  });

  describe('sanitizePackageNames', () => {
    it('should separate valid and invalid packages', () => {
      const packages = [
        'react-native',
        'expo;malicious',
        '@expo/vector-icons',
        'bad|package',
        'lodash',
      ];

      const result = executor.sanitizePackageNames(packages);

      expect(result.valid).toEqual(['react-native', '@expo/vector-icons', 'lodash']);
      expect(result.invalid).toEqual(['expo;malicious', 'bad|package']);
    });
  });

  describe('environment variables', () => {
    it('should set FORCE_COLOR', async () => {
      await executor.executeExpo(['start']);

      const calls = mockSpawn.mock.calls[0];
      const options = calls[2] as any;

      expect(options.env.FORCE_COLOR).toBe('1');
    });

    it('should set EXPO_NO_TELEMETRY', async () => {
      await executor.executeExpo(['start']);

      const calls = mockSpawn.mock.calls[0];
      const options = calls[2] as any;

      expect(options.env.EXPO_NO_TELEMETRY).toBe('1');
    });

    it('should preserve existing EXPO_TOKEN', async () => {
      const originalToken = process.env.EXPO_TOKEN;
      process.env.EXPO_TOKEN = 'test-token';

      await executor.executeExpo(['start']);

      const calls = mockSpawn.mock.calls[0];
      const options = calls[2] as any;

      expect(options.env.EXPO_TOKEN).toBe('test-token');

      // Restore
      if (originalToken) {
        process.env.EXPO_TOKEN = originalToken;
      } else {
        delete process.env.EXPO_TOKEN;
      }
    });
  });

  describe('checkExpoInstalled', () => {
    it('should return true when Expo CLI is installed', async () => {
      const result = await executor.checkExpoInstalled();

      expect(result).toBe(true);
    });

    it('should return false when Expo CLI is not installed', async () => {
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, handler: (error: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('command not found')), 10);
          }
        }),
      });

      const result = await executor.checkExpoInstalled();

      expect(result).toBe(false);
    });
  });

  describe('getExpoVersion', () => {
    it('should return version string', async () => {
      mockSpawn.mockReturnValue({
        stdout: {
          on: jest.fn((event: string, handler: (data: Buffer) => void) => {
            if (event === 'data') {
              setTimeout(() => handler(Buffer.from('6.0.0')), 10);
            }
          }),
        },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') {
            setTimeout(() => handler(0), 20);
          }
        }),
      });

      const version = await executor.getExpoVersion();

      expect(version).toBe('6.0.0');
    });

    it('should return null on error', async () => {
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, handler: (error: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('not found')), 10);
          }
        }),
      });

      const version = await executor.getExpoVersion();

      expect(version).toBeNull();
    });
  });
});
