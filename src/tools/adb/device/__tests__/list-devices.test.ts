/**
 * Tests for ADB List Devices Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { listDevices } from '../list-devices.js';
import type { DeviceInfo } from '../../types.js';

// Mock ADB Client
const mockListDevices = jest.fn() as any;
const mockGetDeviceInfo = jest.fn() as any;

jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    listDevices: mockListDevices,
    getDeviceInfo: mockGetDeviceInfo,
  })),
}));

describe('listDevices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic listing', () => {
    it('should list online devices only by default', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device', model: 'Pixel_5' },
        { id: 'ABC123', state: 'device', model: 'Galaxy_S21' },
      ];

      mockListDevices.mockResolvedValue(mockDevices);

      const result = await listDevices({ include_offline: false });

      expect(mockListDevices).toHaveBeenCalledWith(false);
      expect(result).toEqual({
        devices: mockDevices,
        total: 2,
        online: 2,
        offline: 0,
        summary: 'Found 2 device(s): 2 online, 0 offline',
      });
    });

    it('should include offline devices when requested', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'offline' },
        { id: 'DEF456', state: 'unauthorized' },
      ];

      mockListDevices.mockResolvedValue(mockDevices);

      const result = await listDevices({ include_offline: true });

      expect(mockListDevices).toHaveBeenCalledWith(true);
      expect(result).toEqual({
        devices: mockDevices,
        total: 3,
        online: 1,
        offline: 2,
        summary: 'Found 3 device(s): 1 online, 2 offline',
      });
    });

    it('should return empty list when no devices connected', async () => {
      mockListDevices.mockResolvedValue([]);

      const result = await listDevices({});

      expect(result).toEqual({
        devices: [],
        total: 0,
        online: 0,
        offline: 0,
        summary: 'Found 0 device(s): 0 online, 0 offline',
      });
    });
  });

  describe('detailed information', () => {
    it('should fetch detailed info for online devices when show_details is true', async () => {
      const basicDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'device' },
      ];

      const detailedDevice1: DeviceInfo = {
        id: 'emulator-5554',
        state: 'device',
        model: 'Pixel_5',
        manufacturer: 'Google',
        android_version: '12',
        api_level: 31,
      };

      const detailedDevice2: DeviceInfo = {
        id: 'ABC123',
        state: 'device',
        model: 'Galaxy_S21',
        manufacturer: 'Samsung',
        android_version: '11',
        api_level: 30,
      };

      mockListDevices.mockResolvedValue(basicDevices);
      mockGetDeviceInfo
        .mockResolvedValueOnce(detailedDevice1)
        .mockResolvedValueOnce(detailedDevice2);

      const result = await listDevices({ show_details: true });

      expect(mockGetDeviceInfo).toHaveBeenCalledTimes(2);
      expect(mockGetDeviceInfo).toHaveBeenCalledWith('emulator-5554');
      expect(mockGetDeviceInfo).toHaveBeenCalledWith('ABC123');
      expect(result.devices).toEqual([detailedDevice1, detailedDevice2]);
    });

    it('should not fetch details for offline devices', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: 'emulator-5554', state: 'device' },
        { id: 'ABC123', state: 'offline' },
      ];

      const detailedDevice: DeviceInfo = {
        id: 'emulator-5554',
        state: 'device',
        model: 'Pixel_5',
      };

      mockListDevices.mockResolvedValue(mockDevices);
      mockGetDeviceInfo.mockResolvedValue(detailedDevice);

      const result = await listDevices({ show_details: true, include_offline: true });

      expect(mockGetDeviceInfo).toHaveBeenCalledTimes(1);
      expect(mockGetDeviceInfo).toHaveBeenCalledWith('emulator-5554');
      expect(result.devices).toHaveLength(2);
      expect(result.devices[0]).toEqual(detailedDevice);
      expect(result.devices[1]).toEqual({ id: 'ABC123', state: 'offline' });
    });

    it('should fallback to basic info if detailed info fails', async () => {
      const basicDevices: DeviceInfo[] = [{ id: 'emulator-5554', state: 'device' }];

      mockListDevices.mockResolvedValue(basicDevices);
      mockGetDeviceInfo.mockRejectedValue(new Error('Failed to get info'));

      const result = await listDevices({ show_details: true });

      expect(result.devices).toEqual(basicDevices);
    });
  });

  describe('statistics', () => {
    it('should correctly count online and offline devices', async () => {
      const mockDevices: DeviceInfo[] = [
        { id: '1', state: 'device' },
        { id: '2', state: 'device' },
        { id: '3', state: 'offline' },
        { id: '4', state: 'unauthorized' },
        { id: '5', state: 'device' },
      ];

      mockListDevices.mockResolvedValue(mockDevices);

      const result = await listDevices({ include_offline: true });

      expect(result.total).toBe(5);
      expect(result.online).toBe(3);
      expect(result.offline).toBe(2);
    });

    it('should generate correct summary message', async () => {
      mockListDevices.mockResolvedValue([
        { id: '1', state: 'device' },
        { id: '2', state: 'offline' },
      ]);

      const result = await listDevices({ include_offline: true });

      expect(result.summary).toBe('Found 2 device(s): 1 online, 1 offline');
    });
  });

  describe('error handling', () => {
    it('should handle ADB client errors', async () => {
      mockListDevices.mockRejectedValue(new Error('ADB not found'));

      await expect(listDevices({})).rejects.toThrow();
    });
  });
});
