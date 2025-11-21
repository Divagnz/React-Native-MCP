/**
 * Tests for ADB Get Package Info Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getPackageInfo } from '../get-package-info.js';
import { DeviceNotFoundError, PackageNotFoundError } from '../../../../errors/index.js';
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

describe('getPackageInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful package info retrieval', () => {
    it('should get basic package info', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Packages:
  Package [com.example.app] (abc123):
    userId=10123
    versionCode=100
    versionName=1.0.0
    codePath=/data/app/com.example.app
    dataDir=/data/user/0/com.example.app
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.package_name).toBe('com.example.app');
      expect(result.version_code).toBe('100');
      expect(result.version_name).toBe('1.0.0');
      expect(result.uid).toBe('10123');
      expect(result.apk_path).toBe('/data/app/com.example.app');
      expect(result.data_dir).toBe('/data/user/0/com.example.app');
      expect(result.device_id).toBe('emulator-5554');
    });

    it('should detect system app', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.android.settings]:
  codePath=/system/priv-app/Settings
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.android.settings',
      });

      expect(result.is_system_app).toBe(true);
    });

    it('should detect non-system app', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  codePath=/data/app/com.example.app
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.is_system_app).toBe(false);
    });

    it('should extract SDK versions', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  targetSdk=31
  minSdk=21
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.target_sdk).toBe('31');
      expect(result.min_sdk).toBe('21');
    });

    it('should extract timestamps', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  firstInstallTime=2024-01-01 10:00:00
  lastUpdateTime=2024-01-15 14:30:00
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.first_install_time).toBe('2024-01-01 10:00:00');
      expect(result.last_update_time).toBe('2024-01-15 14:30:00');
    });

    it('should extract permissions', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  requested permissions:
    android.permission.INTERNET: granted=true
    android.permission.CAMERA: granted=false
    android.permission.ACCESS_FINE_LOCATION: granted=true

  install permissions:
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.permissions).toContain('android.permission.INTERNET');
      expect(result.permissions).toContain('android.permission.CAMERA');
      expect(result.permissions).toContain('android.permission.ACCESS_FINE_LOCATION');
    });

    it('should detect enabled status', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  enabled=1
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.is_enabled).toBe(true);
    });

    it('should detect disabled status', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  enabled=0
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.is_enabled).toBe(false);
    });

    it('should use specified device_id', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: 'Package [com.example.app]:\n  versionName=1.0.0',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
        device_id: 'ABC123',
      });

      expect(result.device_id).toBe('ABC123');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'ABC123']),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      await expect(getPackageInfo({ package_name: 'com.example.app' })).rejects.toThrow(
        DeviceNotFoundError
      );
    });

    it('should throw error when specified device not found', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);

      await expect(
        getPackageInfo({ package_name: 'com.example.app', device_id: 'NONEXISTENT' })
      ).rejects.toThrow(DeviceNotFoundError);
    });

    it('should throw PackageNotFoundError when package not found', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: 'Unable to find package: com.nonexistent.app',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      await expect(getPackageInfo({ package_name: 'com.nonexistent.app' })).rejects.toThrow(
        PackageNotFoundError
      );
    });

    it('should throw PackageNotFoundError when command fails', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: false,
        stdout: '',
        stderr: '',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      await expect(getPackageInfo({ package_name: 'com.example.app' })).rejects.toThrow(
        PackageNotFoundError
      );
    });
  });

  describe('input validation', () => {
    it('should validate package name format', async () => {
      await expect(getPackageInfo({ package_name: 'invalid-package-name!' })).rejects.toThrow();
    });

    it('should accept valid package names', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: 'Package [com.example.my_app123]:\n  versionName=1.0.0',
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      await expect(
        getPackageInfo({ package_name: 'com.example.my_app123' })
      ).resolves.toBeDefined();
    });
  });

  describe('partial information handling', () => {
    it('should handle missing optional fields gracefully', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const dumpResult: ADBExecutionResult = {
        success: true,
        stdout: `
Package [com.example.app]:
  versionCode=100
        `,
        stderr: '',
        exit_code: 0,
        duration_ms: 2000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(dumpResult);

      const result = await getPackageInfo({
        package_name: 'com.example.app',
      });

      expect(result.package_name).toBe('com.example.app');
      expect(result.version_code).toBe('100');
      expect(result.version_name).toBeUndefined();
      expect(result.permissions).toBeUndefined();
    });
  });
});
