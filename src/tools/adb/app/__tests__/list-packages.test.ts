/**
 * Tests for ADB List Packages Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { listPackages } from '../list-packages.js';
import { DeviceNotFoundError } from '../../../../errors/index.js';
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

describe('listPackages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful package listing', () => {
    it('should list third-party packages by default', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const thirdPartyResult: ADBExecutionResult = {
        success: true,
        stdout: 'package:com.example.app1\npackage:com.example.app2\n',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(thirdPartyResult);

      const result = await listPackages({});

      expect(result.packages).toHaveLength(2);
      expect(result.packages[0].package_name).toBe('com.example.app1');
      expect(result.packages[0].type).toBe('third-party');
      expect(result.packages[1].package_name).toBe('com.example.app2');
      expect(result.third_party_count).toBe(2);
      expect(result.system_count).toBe(0);
    });

    it('should list system packages when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const systemResult: ADBExecutionResult = {
        success: true,
        stdout: 'package:com.android.settings\npackage:com.android.systemui\n',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(systemResult);

      const result = await listPackages({
        show_system: true,
        show_third_party: false,
      });

      expect(result.packages).toHaveLength(2);
      expect(result.packages[0].type).toBe('system');
      expect(result.system_count).toBe(2);
      expect(result.third_party_count).toBe(0);
    });

    it('should list both system and third-party packages', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('-3')) {
          return Promise.resolve({
            success: true,
            stdout: 'package:com.example.app\n',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        } else if (args.includes('-s')) {
          return Promise.resolve({
            success: true,
            stdout: 'package:com.android.settings\n',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await listPackages({
        show_system: true,
        show_third_party: true,
      });

      expect(result.packages).toHaveLength(2);
      expect(result.third_party_count).toBe(1);
      expect(result.system_count).toBe(1);
    });

    it('should list disabled packages when specified', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('-d')) {
          return Promise.resolve({
            success: true,
            stdout: 'package:com.example.disabled\n',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        } else if (args.includes('-3')) {
          return Promise.resolve({
            success: true,
            stdout: '',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await listPackages({
        show_disabled: true,
      });

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].type).toBe('disabled');
      expect(result.disabled_count).toBe(1);
    });

    it('should filter packages by name', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const thirdPartyResult: ADBExecutionResult = {
        success: true,
        stdout: 'package:com.example.app1\npackage:com.example.app2\npackage:com.other.app\n',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(thirdPartyResult);

      const result = await listPackages({
        filter: 'example',
      });

      expect(result.packages).toHaveLength(2);
      expect(result.packages.every((p) => p.package_name.includes('example'))).toBe(true);
      expect(result.filter_applied).toBe('example');
    });

    it('should use specified device_id', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];
      const thirdPartyResult: ADBExecutionResult = {
        success: true,
        stdout: 'package:com.example.app\n',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(thirdPartyResult);

      const result = await listPackages({
        device_id: 'ABC123',
      });

      expect(result.device_id).toBe('ABC123');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.arrayContaining(['-s', 'ABC123']),
        expect.any(Object)
      );
    });

    it('should sort packages alphabetically', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const thirdPartyResult: ADBExecutionResult = {
        success: true,
        stdout: 'package:com.zebra.app\npackage:com.alpha.app\npackage:com.beta.app\n',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(thirdPartyResult);

      const result = await listPackages({});

      expect(result.packages[0].package_name).toBe('com.alpha.app');
      expect(result.packages[1].package_name).toBe('com.beta.app');
      expect(result.packages[2].package_name).toBe('com.zebra.app');
    });

    it('should avoid duplicate packages', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockImplementation((args: string[]) => {
        // Same package in both system and disabled lists
        return Promise.resolve({
          success: true,
          stdout: 'package:com.example.app\n',
          stderr: '',
          exit_code: 0,
          duration_ms: 1000,
        });
      });

      const result = await listPackages({
        show_third_party: true,
        show_disabled: true,
      });

      // Should only have one entry for the package
      expect(result.packages.filter((p) => p.package_name === 'com.example.app')).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should throw error when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      await expect(listPackages({})).rejects.toThrow(DeviceNotFoundError);
    });

    it('should throw error when specified device not found', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);

      await expect(listPackages({ device_id: 'NONEXISTENT' })).rejects.toThrow(DeviceNotFoundError);
    });

    it('should handle empty package list gracefully', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const emptyResult: ADBExecutionResult = {
        success: true,
        stdout: '',
        stderr: '',
        exit_code: 0,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(emptyResult);

      const result = await listPackages({});

      expect(result.packages).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle command failure gracefully', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];
      const failedResult: ADBExecutionResult = {
        success: false,
        stdout: '',
        stderr: 'Error',
        exit_code: 1,
        duration_ms: 1000,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockResolvedValue(failedResult);

      const result = await listPackages({});

      expect(result.packages).toHaveLength(0);
    });
  });

  describe('summary generation', () => {
    it('should generate accurate summary', async () => {
      const mockDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];

      mockListDevices.mockResolvedValue(mockDevices);
      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('-3')) {
          return Promise.resolve({
            success: true,
            stdout: 'package:com.example.app1\npackage:com.example.app2\n',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        } else if (args.includes('-s')) {
          return Promise.resolve({
            success: true,
            stdout: 'package:com.android.settings\n',
            stderr: '',
            exit_code: 0,
            duration_ms: 1000,
          });
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await listPackages({
        show_system: true,
        show_third_party: true,
      });

      expect(result.summary).toBe('Found 3 package(s): 2 third-party, 1 system, 0 disabled');
    });
  });
});
