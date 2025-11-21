/**
 * Tests for ADB Uninstall App Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { uninstallApp } from '../uninstall-app.js';
import { ADBError, DeviceNotFoundError, PackageNotFoundError } from '../../../../errors/index.js';
import type { ADBExecutionResult, DeviceInfo } from '../../types.js';

// Mock ADB Client
const mockListDevices = jest.fn() as any;
const mockExecute = jest.fn() as any;

jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    listDevices: mockListDevices,
    execute: mockExecute,
  })),
}));

describe('uninstallApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful uninstallation', () => {
    it('should uninstall package successfully', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      const result = await uninstallApp({
        package_name: 'com.example.app',
      });

      expect(result.success).toBe(true);
      expect(result.package_name).toBe('com.example.app');
      expect(result.device_id).toBe('emulator-5554');
      expect(result.data_kept).toBe(false);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'emulator-5554', 'uninstall', 'com.example.app']),
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it('should use specified device_id', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];
      const uninstallResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      const result = await uninstallApp({
        package_name: 'com.example.app',
        device_id: 'ABC123',
      });

      expect(result.device_id).toBe('ABC123');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'ABC123', 'uninstall']),
        expect.any(Object)
      );
    });

    it('should keep data when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      const result = await uninstallApp({
        package_name: 'com.example.app',
        keep_data: true,
      });

      expect(result.data_kept).toBe(true);
      expect(mockExecute).toHaveBeenCalledWith(expect.arrayContaining(['-k']), expect.any(Object));
    });
  });

  describe('uninstallation failures', () => {
    it('should throw error when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      await expect(uninstallApp({ package_name: 'com.example.app' })).rejects.toThrow(
        DeviceNotFoundError
      );
    });

    it('should throw error when specified device not found', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);

      await expect(
        uninstallApp({ package_name: 'com.example.app', device_id: 'NONEXISTENT' })
      ).rejects.toThrow(DeviceNotFoundError);
    });

    it('should throw PackageNotFoundError when package not installed', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [not installed for 0]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.nonexistent.app' })).rejects.toThrow(
        PackageNotFoundError
      );
    });

    it('should throw PackageNotFoundError for unknown package', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [DELETE_FAILED_INTERNAL_ERROR: Unknown package: com.example.app]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.example.app' })).rejects.toThrow(
        PackageNotFoundError
      );
    });

    it('should throw ADBError on internal error', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [DELETE_FAILED_INTERNAL_ERROR: Some other error]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.example.app' })).rejects.toThrow(
        'Internal error'
      );
    });

    it('should throw ADBError on generic failure', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [SOME_ERROR]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.example.app' })).rejects.toThrow(
        'Failed to uninstall package'
      );
    });

    it('should throw error on unexpected response', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: true,
        stdout: 'Unexpected output',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.example.app' })).rejects.toThrow(ADBError);
    });
  });

  describe('input validation', () => {
    it('should validate package name format', async () => {
      await expect(uninstallApp({ package_name: 'invalid-package-name!' })).rejects.toThrow();
    });

    it('should accept valid package names', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const uninstallResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(uninstallResult);

      await expect(uninstallApp({ package_name: 'com.example.my_app123' })).resolves.toBeDefined();
    });
  });
});
