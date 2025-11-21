/**
 * Tests for ADB Device Info Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getDeviceInfo } from '../device-info.js';
import { DeviceNotFoundError } from '../../../../errors/index.js';
import type { DeviceInfo, ADBExecutionResult } from '../../types.js';

// Mock ADB Client
const mockListDevices = jest.fn() as any;
const mockGetDeviceInfo = jest.fn() as any;
const mockExecute = jest.fn() as any;

jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    listDevices: mockListDevices,
    getDeviceInfo: mockGetDeviceInfo,
    execute: mockExecute,
  })),
}));

describe('getDeviceInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('device selection', () => {
    it('should use first available device when device_id not specified', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];

      const detailedInfo: DeviceInfo = {
        id: 'emulator-5554',
        state: 'device',
        model: 'Pixel_5',
        manufacturer: 'Google',
        android_version: '12',
        api_level: 31,
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockGetDeviceInfo.mockResolvedValue(detailedInfo);
      mockExecute.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: '',
        exit_code: 1,
        duration_ms: 10,
      });

      const result = await getDeviceInfo({});

      expect(mockGetDeviceInfo).toHaveBeenCalledWith('emulator-5554');
      expect(result.id).toBe('emulator-5554');
    });

    it('should use specified device_id', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];

      const detailedInfo: DeviceInfo = {
        id: 'ABC123',
        state: 'device',
        model: 'Galaxy_S21',
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockGetDeviceInfo.mockResolvedValue(detailedInfo);
      mockExecute.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: '',
        exit_code: 1,
        duration_ms: 10,
      });

      const result = await getDeviceInfo({ device_id: 'ABC123' });

      expect(mockGetDeviceInfo).toHaveBeenCalledWith('ABC123');
      expect(result.id).toBe('ABC123');
    });

    it('should throw error when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      await expect(getDeviceInfo({})).rejects.toThrow(DeviceNotFoundError);
    });

    it('should throw error when specified device not found', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);

      await expect(getDeviceInfo({ device_id: 'NONEXISTENT' })).rejects.toThrow(
        DeviceNotFoundError
      );
    });
  });

  describe('additional information retrieval', () => {
    beforeEach(() => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);
      mockGetDeviceInfo.mockResolvedValue({
        id: 'emulator-5554',
        state: 'device',
        model: 'Pixel_5',
      });
    });

    it('should fetch SDK version', async () => {
      const sdkResult: ADBExecutionResult = {
        success: true,
        stdout: '31',
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('ro.build.version.sdk')) {
          return Promise.resolve(sdkResult);
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await getDeviceInfo({});

      expect(result.sdk_version).toBe('31');
    });

    it('should fetch screen resolution', async () => {
      const sizeResult: ADBExecutionResult = {
        success: true,
        stdout: 'Physical size: 1080x2340',
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('size')) {
          return Promise.resolve(sizeResult);
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await getDeviceInfo({});

      expect(result.screen_resolution).toBe('1080x2340');
    });

    it('should fetch screen density', async () => {
      const densityResult: ADBExecutionResult = {
        success: true,
        stdout: 'Physical density: 420',
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('density')) {
          return Promise.resolve(densityResult);
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await getDeviceInfo({});

      expect(result.screen_density).toBe('420');
    });

    it('should fetch battery level', async () => {
      const batteryResult: ADBExecutionResult = {
        success: true,
        stdout: 'level: 85',
        stderr: '',
        exit_code: 0,
        duration_ms: 100,
      };

      mockExecute.mockImplementation((args: string[]) => {
        if (args.includes('battery')) {
          return Promise.resolve(batteryResult);
        }
        return Promise.resolve({
          success: false,
          stdout: '',
          stderr: '',
          exit_code: 1,
          duration_ms: 10,
        });
      });

      const result = await getDeviceInfo({});

      expect(result.battery_level).toBe('85%');
    });

    it('should handle failed additional info gracefully', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: 'Error',
        exit_code: 1,
        duration_ms: 10,
      });

      const result = await getDeviceInfo({});

      expect(result.sdk_version).toBeUndefined();
      expect(result.screen_resolution).toBeUndefined();
      expect(result.screen_density).toBeUndefined();
      expect(result.battery_level).toBeUndefined();
    });
  });

  describe('summary generation', () => {
    it('should generate summary with model and version', async () => {
      mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }]);
      mockGetDeviceInfo.mockResolvedValue({
        id: 'emulator-5554',
        state: 'device',
        model: 'Pixel_5',
        android_version: '12',
      });
      mockExecute.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: '',
        exit_code: 1,
        duration_ms: 10,
      });

      const result = await getDeviceInfo({});

      expect(result.summary).toBe('Device: Pixel_5 (12) - device');
    });

    it('should generate summary without model', async () => {
      mockListDevices.mockResolvedValue([{ id: 'ABC123', state: 'device' }]);
      mockGetDeviceInfo.mockResolvedValue({
        id: 'ABC123',
        state: 'device',
      });
      mockExecute.mockResolvedValue({
        success: false,
        stdout: '',
        stderr: '',
        exit_code: 1,
        duration_ms: 10,
      });

      const result = await getDeviceInfo({});

      expect(result.summary).toBe('Device: ABC123 (Unknown) - device');
    });
  });
});
