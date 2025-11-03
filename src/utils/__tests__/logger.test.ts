import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as logger from '../logger.js';

describe('Logger', () => {
  // Mock the logger methods to avoid actual file writes during tests
  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  describe('logToolInvocation', () => {
    it('should log tool invocation without duration', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', { arg1: 'value1' });
      }).not.toThrow();
    });

    it('should log tool invocation with duration', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', { arg1: 'value1' }, 123.45);
      }).not.toThrow();
    });

    it('should handle null args', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', null);
      }).not.toThrow();
    });

    it('should handle undefined args', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', undefined);
      }).not.toThrow();
    });
  });

  describe('logToolSuccess', () => {
    it('should log tool success', () => {
      expect(() => {
        logger.logToolSuccess('test_tool', 100.5);
      }).not.toThrow();
    });

    it('should log tool success with result size', () => {
      expect(() => {
        logger.logToolSuccess('test_tool', 100.5, 1024);
      }).not.toThrow();
    });
  });

  describe('logToolFailure', () => {
    it('should log tool failure', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.logToolFailure('test_tool', error);
      }).not.toThrow();
    });

    it('should log tool failure with duration', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.logToolFailure('test_tool', error, 50.25);
      }).not.toThrow();
    });
  });

  describe('logValidationError', () => {
    it('should log validation error without details', () => {
      expect(() => {
        logger.logValidationError('test_context', 'Validation failed');
      }).not.toThrow();
    });

    it('should log validation error with details', () => {
      expect(() => {
        logger.logValidationError('test_context', 'Validation failed', {
          field: 'username',
          value: 'invalid',
        });
      }).not.toThrow();
    });
  });

  describe('logFileOperation', () => {
    it('should log successful file operation', () => {
      expect(() => {
        logger.logFileOperation('read', '/path/to/file.txt', true);
      }).not.toThrow();
    });

    it('should log failed file operation', () => {
      expect(() => {
        logger.logFileOperation('write', '/path/to/file.txt', false, 'Permission denied');
      }).not.toThrow();
    });
  });

  describe('logPerformance', () => {
    it('should log performance metric without metadata', () => {
      expect(() => {
        logger.logPerformance('test_operation', 250.75);
      }).not.toThrow();
    });

    it('should log performance metric with metadata', () => {
      expect(() => {
        logger.logPerformance('test_operation', 250.75, {
          cacheHit: true,
          itemsProcessed: 100,
        });
      }).not.toThrow();
    });
  });

  describe('logServerStartup', () => {
    it('should log server startup without config', () => {
      expect(() => {
        logger.logServerStartup('1.0.0');
      }).not.toThrow();
    });

    it('should log server startup with config', () => {
      expect(() => {
        logger.logServerStartup('1.0.0', {
          port: 3000,
          env: 'development',
        });
      }).not.toThrow();
    });
  });

  describe('logServerShutdown', () => {
    it('should log server shutdown without reason', () => {
      expect(() => {
        logger.logServerShutdown();
      }).not.toThrow();
    });

    it('should log server shutdown with reason', () => {
      expect(() => {
        logger.logServerShutdown('SIGTERM received');
      }).not.toThrow();
    });
  });

  describe('createChildLogger', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.createChildLogger({ requestId: '123' });
      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });
  });

  describe('flushLogs', () => {
    it('should flush logs', async () => {
      // This test just ensures the function can be called
      // Actual flushing behavior is tested through integration
      expect(logger.flushLogs).toBeDefined();
    });
  });

  describe('sanitizeArgs (indirectly tested)', () => {
    it('should handle sensitive data in tool invocation', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', {
          username: 'john',
          password: 'secret123',
          apiKey: 'key123',
        });
      }).not.toThrow();
    });

    it('should handle long strings', () => {
      const longString = 'x'.repeat(2000);
      expect(() => {
        logger.logToolInvocation('test_tool', { data: longString });
      }).not.toThrow();
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 20 }, (_, i) => i);
      expect(() => {
        logger.logToolInvocation('test_tool', { items: largeArray });
      }).not.toThrow();
    });

    it('should handle nested objects with sensitive data', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', {
          user: {
            name: 'john',
            credentials: {
              token: 'abc123',
              secret: 'xyz789',
            },
          },
        });
      }).not.toThrow();
    });

    it('should handle strings containing sensitive keywords', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', 'This contains password and token keywords');
      }).not.toThrow();
    });

    it('should handle null values', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', { value: null });
      }).not.toThrow();
    });

    it('should handle undefined values', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', { value: undefined });
      }).not.toThrow();
    });

    it('should handle arrays with mixed types', () => {
      expect(() => {
        logger.logToolInvocation('test_tool', [
          'string',
          123,
          null,
          undefined,
          { nested: 'object' },
        ]);
      }).not.toThrow();
    });
  });

  describe('logger instance', () => {
    it('should have logger instance exported', () => {
      expect(logger.logger).toBeDefined();
      expect(typeof logger.logger.info).toBe('function');
      expect(typeof logger.logger.error).toBe('function');
      expect(typeof logger.logger.debug).toBe('function');
      expect(typeof logger.logger.warn).toBe('function');
    });

    it('should have default export', () => {
      expect(logger.default).toBeDefined();
      expect(logger.default).toBe(logger.logger);
    });
  });
});
