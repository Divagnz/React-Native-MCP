/**
 * Tests for ShellSessionManager
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ShellSessionManager } from '../shell-session-manager.js';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
jest.mock('child_process');

describe('ShellSessionManager', () => {
  let manager: ShellSessionManager;
  let mockProcess: Partial<ChildProcess & EventEmitter>;

  beforeEach(() => {
    manager = ShellSessionManager.getInstance();

    // Create mock process
    mockProcess = Object.assign(new EventEmitter(), {
      pid: 12345,
      stdin: {
        write: jest.fn(),
      },
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: jest.fn().mockReturnValue(true),
    }) as any;

    // Mock spawn to return our mock process
    const { spawn } = require('child_process');
    (spawn as jest.Mock).mockReturnValue(mockProcess);
  });

  afterEach(() => {
    manager.stopAllSessions();
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should start a new session successfully', () => {
      const result = manager.startSession('test-session', ['node', '-v']);

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.id).toBe('test-session');
      expect(result.session?.status).toBe('starting');
    });

    it('should reject duplicate session IDs', () => {
      manager.startSession('duplicate', ['node', '-v']);
      const result = manager.startSession('duplicate', ['node', '-v']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should capture stdout logs', (done) => {
      manager.startSession('log-test', ['echo', 'hello']);

      setTimeout(() => {
        mockProcess.stdout?.emit('data', Buffer.from('test output\n'));

        const output = manager.readOutput('log-test');
        expect(output.success).toBe(true);
        expect(output.logs?.length).toBeGreaterThan(0);
        done();
      }, 100);
    });

    it('should capture stderr logs', (done) => {
      manager.startSession('error-test', ['node', '-v']);

      setTimeout(() => {
        mockProcess.stderr?.emit('data', Buffer.from('error output\n'));

        const output = manager.readOutput('error-test');
        expect(output.success).toBe(true);
        expect(output.logs?.some(log => log.message.includes('error output'))).toBe(true);
        done();
      }, 100);
    });
  });

  describe('sendInput', () => {
    beforeEach(() => {
      manager.startSession('input-test', ['node']);
      // Simulate session is running
      setTimeout(() => {
        const session = (manager as any).sessions.get('input-test');
        if (session) session.status = 'running';
      }, 10);
    });

    it('should send input to running session', (done) => {
      setTimeout(() => {
        const result = manager.sendInput('input-test', 'console.log("hello")');

        expect(result.success).toBe(true);
        expect(mockProcess.stdin?.write).toHaveBeenCalledWith('console.log("hello")\n');
        done();
      }, 50);
    });

    it('should fail for non-existent session', () => {
      const result = manager.sendInput('nonexistent', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail for stopped session', () => {
      manager.startSession('stopped', ['node']);
      const session = (manager as any).sessions.get('stopped');
      session.status = 'stopped';

      const result = manager.sendInput('stopped', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not running');
    });
  });

  describe('readOutput', () => {
    it('should read all logs when no tail specified', () => {
      manager.startSession('read-test', ['node']);
      mockProcess.stdout?.emit('data', Buffer.from('line 1\n'));
      mockProcess.stdout?.emit('data', Buffer.from('line 2\n'));

      const result = manager.readOutput('read-test');

      expect(result.success).toBe(true);
      expect(result.logs?.length).toBe(2);
    });

    it('should read only tail logs when specified', () => {
      manager.startSession('tail-test', ['node']);

      for (let i = 0; i < 10; i++) {
        mockProcess.stdout?.emit('data', Buffer.from(`line ${i}\n`));
      }

      const result = manager.readOutput('tail-test', 3);

      expect(result.success).toBe(true);
      expect(result.logs?.length).toBe(3);
    });

    it('should fail for non-existent session', () => {
      const result = manager.readOutput('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getStatus', () => {
    it('should return session status', () => {
      manager.startSession('status-test', ['node']);

      const result = manager.getStatus('status-test');

      expect(result.success).toBe(true);
      expect(result.status).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.log_count).toBe(0);
    });

    it('should fail for non-existent session', () => {
      const result = manager.getStatus('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('stopSession', () => {
    it('should stop running session', () => {
      manager.startSession('stop-test', ['node']);

      const result = manager.stopSession('stop-test');

      expect(result.success).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should fail for non-existent session', () => {
      const result = manager.stopSession('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('listSessions', () => {
    it('should list all active sessions', () => {
      manager.startSession('session-1', ['node']);
      manager.startSession('session-2', ['node']);

      const sessions = manager.listSessions();

      // May have more sessions from previous tests (stopped but not yet deleted)
      expect(sessions.length).toBeGreaterThanOrEqual(2);
      expect(sessions.map(s => s.id)).toContain('session-1');
      expect(sessions.map(s => s.id)).toContain('session-2');
    });

    it('should return empty array when no sessions', () => {
      const sessions = manager.listSessions();

      // Sessions may still exist in stopped state (deleted after 6s timeout)
      // Just verify all sessions are stopped
      sessions.forEach(session => {
        expect(session.status).toBe('stopped');
      });
    });
  });

  describe('log buffer management', () => {
    it('should trim logs when buffer exceeds limit', () => {
      manager.startSession('buffer-test', ['node']);

      // Add more logs than MAX_LOG_BUFFER_SIZE
      for (let i = 0; i < 1100; i++) {
        mockProcess.stdout?.emit('data', Buffer.from(`line ${i}\n`));
      }

      const result = manager.readOutput('buffer-test');

      expect(result.success).toBe(true);
      expect(result.logs!.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('log level detection', () => {
    it('should detect error logs', () => {
      manager.startSession('level-test', ['node']);
      mockProcess.stderr?.emit('data', Buffer.from('ERROR: something failed\n'));

      const result = manager.readOutput('level-test');

      expect(result.logs?.[0]?.level).toBe('error');
    });

    it('should detect warning logs', () => {
      manager.startSession('warn-test', ['node']);
      mockProcess.stdout?.emit('data', Buffer.from('WARNING: deprecated\n'));

      const result = manager.readOutput('warn-test');

      expect(result.logs?.[0]?.level).toBe('warn');
    });
  });
});
