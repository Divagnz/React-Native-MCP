/**
 * Tests for ADB Connect Device Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { connectDevice } from '../connect-device.js';
import { ADBError } from '../../../../errors/index.js';
import type { ADBExecutionResult } from '../../types.js';

// Mock getADBClient
const mockExecute = jest.fn() as any;
jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    execute: mockExecute,
  })),
}));

describe('connectDevice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful connection', () => {
    it('should connect to device successfully', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to 192.168.1.100:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      const response = await connectDevice({
        host: '192.168.1.100',
        port: 5555,
      });

      expect(mockExecute).toHaveBeenCalledWith(
        ['connect', '192.168.1.100:5555'],
        expect.objectContaining({ timeout: 10000 })
      );

      expect(response).toEqual({
        success: true,
        device_id: '192.168.1.100:5555',
        message: 'Successfully connected to 192.168.1.100:5555',
        connection_string: '192.168.1.100:5555',
        instructions: expect.any(Array),
      });
    });

    it('should use default port 5555', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to 192.168.1.100:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await connectDevice({ host: '192.168.1.100' });

      expect(mockExecute).toHaveBeenCalledWith(
        ['connect', '192.168.1.100:5555'],
        expect.any(Object)
      );
    });

    it('should use custom port when specified', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to 192.168.1.100:5037',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await connectDevice({
        host: '192.168.1.100',
        port: 5037,
      });

      expect(mockExecute).toHaveBeenCalledWith(
        ['connect', '192.168.1.100:5037'],
        expect.any(Object)
      );
    });

    it('should use custom timeout when specified', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to 192.168.1.100:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await connectDevice({
        host: '192.168.1.100',
        timeout: 30000,
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ timeout: 30000 })
      );
    });
  });

  describe('already connected', () => {
    it('should handle already connected device', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'already connected to 192.168.1.100:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockExecute.mockResolvedValue(result);

      const response = await connectDevice({ host: '192.168.1.100' });

      expect(response).toEqual({
        success: true,
        device_id: '192.168.1.100:5555',
        message: 'Already connected to 192.168.1.100:5555',
        connection_string: '192.168.1.100:5555',
        was_already_connected: true,
      });
    });
  });

  describe('connection failures', () => {
    it('should throw error on connection failure', async () => {
      const result: ADBExecutionResult = {
        success: false,
        stdout: 'failed to connect to 192.168.1.100:5555',
        stderr: '',
        exit_code: 1,
        duration_ms: 5000,
      };

      mockExecute.mockResolvedValue(result);

      await expect(connectDevice({ host: '192.168.1.100' })).rejects.toThrow(ADBError);
    });

    it('should include troubleshooting steps on failure', async () => {
      const result: ADBExecutionResult = {
        success: false,
        stdout: 'cannot connect to 192.168.1.100:5555',
        stderr: '',
        exit_code: 1,
        duration_ms: 5000,
      };

      mockExecute.mockResolvedValue(result);

      try {
        await connectDevice({ host: '192.168.1.100' });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ADBError);
        const adbError = error as ADBError;
        expect(adbError.details).toHaveProperty('troubleshooting');
        expect(Array.isArray((adbError.details as Record<string, unknown>).troubleshooting)).toBe(
          true
        );
      }
    });

    it('should handle unexpected response', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'some unexpected output',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await expect(connectDevice({ host: '192.168.1.100' })).rejects.toThrow(ADBError);
    });
  });

  describe('input validation', () => {
    it('should accept valid IP address', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to 192.168.1.100:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await expect(connectDevice({ host: '192.168.1.100' })).resolves.toBeDefined();
    });

    it('should accept valid hostname', async () => {
      const result: ADBExecutionResult = {
        success: true,
        stdout: 'connected to android-device.local:5555',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockExecute.mockResolvedValue(result);

      await expect(connectDevice({ host: 'android-device.local' })).resolves.toBeDefined();
    });

    it('should reject invalid host format', async () => {
      // Should reject hosts with consecutive dots or invalid characters
      await expect(connectDevice({ host: 'invalid..host' })).rejects.toThrow('Invalid host format');
    });

    it('should reject invalid port', async () => {
      await expect(connectDevice({ host: '192.168.1.100', port: 70000 })).rejects.toThrow();
    });
  });
});
