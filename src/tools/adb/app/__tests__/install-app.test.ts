/**
 * Tests for ADB Install App Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { installApp } from '../install-app.js';
import { ADBError, DeviceNotFoundError } from '../../../../errors/index.js';
import type { ADBExecutionResult, DeviceInfo } from '../../types.js';
import * as fs from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

// Mock ADB Client
const mockListDevices = jest.fn() as any;
const mockExecute = jest.fn() as any;

jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    listDevices: mockListDevices,
    execute: mockExecute,
  })),
}));

describe('installApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful installation', () => {
    beforeEach(() => {
      // Mock file exists
      mockStat.mockResolvedValue({
        isFile: () => true,
      } as any);
    });

    it('should install APK successfully', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      const result = await installApp({
        apk_path: '/path/to/app.apk',
      });

      expect(result.success).toBe(true);
      expect(result.device_id).toBe('emulator-5554');
      expect(result.apk_path).toBe('/path/to/app.apk');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'emulator-5554', 'install', '/path/to/app.apk']),
        expect.objectContaining({ timeout: 120000 })
      );
    });

    it('should use specified device_id', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await installApp({
        apk_path: '/path/to/app.apk',
        device_id: 'ABC123',
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'ABC123', 'install']),
        expect.any(Object)
      );
    });

    it('should use replace flag when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      const result = await installApp({
        apk_path: '/path/to/app.apk',
        replace: true,
      });

      expect(mockExecute).toHaveBeenCalledWith(expect.arrayContaining(['-r']), expect.any(Object));
      expect(result.options.replaced).toBe(true);
    });

    it('should use grant_permissions flag when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      const result = await installApp({
        apk_path: '/path/to/app.apk',
        grant_permissions: true,
      });

      expect(mockExecute).toHaveBeenCalledWith(expect.arrayContaining(['-g']), expect.any(Object));
      expect(result.options.permissions_granted).toBe(true);
    });

    it('should use allow_downgrade flag when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      const result = await installApp({
        apk_path: '/path/to/app.apk',
        allow_downgrade: true,
      });

      expect(mockExecute).toHaveBeenCalledWith(expect.arrayContaining(['-d']), expect.any(Object));
      expect(result.options.downgrade_allowed).toBe(true);
    });

    it('should use allow_test_apk flag when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      const result = await installApp({
        apk_path: '/path/to/app.apk',
        allow_test_apk: true,
      });

      expect(mockExecute).toHaveBeenCalledWith(expect.arrayContaining(['-t']), expect.any(Object));
      expect(result.options.test_apk_allowed).toBe(true);
    });

    it('should extract package name when available', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Success',
        stderr: '',
        exit_code: 0,
        duration_ms: 5000,
      };
      const aaptResult: ADBExecutionResult = {
        success: true,
        stdout: "package: name='com.example.app' versionCode='1'",
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('aapt')) {
          return Promise.resolve(aaptResult);
        }
        return Promise.resolve(installResult);
      });

      const result = await installApp({
        apk_path: '/path/to/app.apk',
      });

      expect(result.package_name).toBe('com.example.app');
    });
  });

  describe('installation failures', () => {
    beforeEach(() => {
      mockStat.mockResolvedValue({
        isFile: () => true,
      } as any);
    });

    it('should throw error when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow(
        DeviceNotFoundError
      );
    });

    it('should throw error when specified device not found', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);

      await expect(
        installApp({ apk_path: '/path/to/app.apk', device_id: 'NONEXISTENT' })
      ).rejects.toThrow(DeviceNotFoundError);
    });

    it('should throw error when app already exists without replace flag', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [INSTALL_FAILED_ALREADY_EXISTS]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow(
        'already installed'
      );
    });

    it('should throw error on version downgrade without flag', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [INSTALL_FAILED_VERSION_DOWNGRADE]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow('downgrade');
    });

    it('should throw error on insufficient storage', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [INSTALL_FAILED_INSUFFICIENT_STORAGE]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow('storage');
    });

    it('should throw error on invalid APK', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: false,
        stdout: 'Failure [INSTALL_FAILED_INVALID_APK]',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow(
        'Invalid or corrupted APK'
      );
    });

    it('should throw error on unexpected response', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const installResult: ADBExecutionResult = {
        success: true,
        stdout: 'Unexpected output',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(installResult);

      await expect(installApp({ apk_path: '/path/to/app.apk' })).rejects.toThrow(ADBError);
    });
  });

  describe('input validation', () => {
    it('should throw error when APK file does not exist', async () => {
      mockStat.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      await expect(installApp({ apk_path: '/nonexistent/app.apk' })).rejects.toThrow('not found');
    });

    it('should throw error when path is not a file', async () => {
      mockStat.mockResolvedValue({
        isFile: () => false,
      } as any);

      await expect(installApp({ apk_path: '/path/to/directory' })).rejects.toThrow(
        'must be a file'
      );
    });

    it('should throw error when file does not have .apk extension', async () => {
      mockStat.mockResolvedValue({
        isFile: () => true,
      } as any);

      await expect(installApp({ apk_path: '/path/to/file.txt' })).rejects.toThrow('.apk extension');
    });
  });
});
