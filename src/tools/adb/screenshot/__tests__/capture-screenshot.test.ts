/**
 * Tests for ADB Capture Screenshot Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { captureScreenshot } from '../capture-screenshot.js';
import type { CaptureScreenshotInput } from '../capture-screenshot.js';
import type { ADBExecutionResult, DeviceInfo } from '../../types.js';
import * as fs from 'fs/promises';

// Mock ADB Client
const mockListDevices = jest.fn() as any;
const mockExecute = jest.fn() as any;

jest.mock('../../core/index.js', () => ({
  getADBClient: jest.fn(() => ({
    listDevices: mockListDevices,
    execute: mockExecute,
  })) as any,
}));

// Mock fs/promises
jest.mock('fs/promises');
const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

describe('captureScreenshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should capture screenshot with default options', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute
      .mockResolvedValueOnce({
        success: true,
        stdout: '',
        stderr: '',
      } as ADBExecutionResult)
      .mockResolvedValueOnce({
        success: true,
        stdout: '',
        stderr: '',
      } as ADBExecutionResult)
      .mockResolvedValueOnce({
        success: true,
        stdout: '',
        stderr: '',
      } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 12345, isFile: () => true } as any);

    const result = await captureScreenshot(input);

    expect(result.success).toBe(true);
    expect(result.device_id).toBe('emulator-5554');
    expect(result.output_path).toBe('/tmp/screenshot.png');
    expect(result.format).toBe('png');
    expect(result.display_id).toBe(0);
    expect(result.file_size).toBe(12345);

    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      ['-s', 'emulator-5554', 'shell', 'screencap', '-p', '/sdcard/screenshot_temp.png'],
      expect.any(Object)
    );

    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      ['-s', 'emulator-5554', 'pull', '/sdcard/screenshot_temp.png', '/tmp/screenshot.png'],
      expect.any(Object)
    );

    expect(mockExecute).toHaveBeenNthCalledWith(
      3,
      ['-s', 'emulator-5554', 'shell', 'rm', '/sdcard/screenshot_temp.png'],
      expect.any(Object)
    );
  });

  it('should capture screenshot with specified device', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
      device_id: 'device123',
    };

    mockListDevices.mockResolvedValue([{ id: 'device123', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValue({ success: true, stdout: '', stderr: '' } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 12345, isFile: () => true } as any);

    const result = await captureScreenshot(input);

    expect(result.device_id).toBe('device123');
  });

  it('should capture screenshot in raw format', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
      format: 'raw',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValue({ success: true, stdout: '', stderr: '' } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 12345, isFile: () => true } as any);

    const result = await captureScreenshot(input);

    expect(result.format).toBe('raw');

    // raw format should not include -p flag
    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      ['-s', 'emulator-5554', 'shell', 'screencap', '/sdcard/screenshot_temp.png'],
      expect.any(Object)
    );
  });

  it('should capture screenshot from specific display', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
      display_id: 1,
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValue({ success: true, stdout: '', stderr: '' } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 12345, isFile: () => true } as any);

    const result = await captureScreenshot(input);

    expect(result.display_id).toBe(1);

    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      ['-s', 'emulator-5554', 'shell', 'screencap', '-p', '-d', '1', '/sdcard/screenshot_temp.png'],
      expect.any(Object)
    );
  });

  it('should create output directory if it does not exist', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshots/test.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValue({ success: true, stdout: '', stderr: '' } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 12345, isFile: () => true } as any);

    await captureScreenshot(input);

    expect(mockMkdir).toHaveBeenCalledWith('/tmp/screenshots', { recursive: true });
  });

  it('should throw error if no devices connected', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
    };

    mockListDevices.mockResolvedValue([] as DeviceInfo[]);

    await expect(captureScreenshot(input)).rejects.toThrow('No devices connected');
  });

  it('should throw error if specified device not found', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
      device_id: 'device999',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);

    await expect(captureScreenshot(input)).rejects.toThrow('Device device999 not found');
  });

  it('should throw error if output file does not have .png extension', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.jpg',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);

    await expect(captureScreenshot(input)).rejects.toThrow('Output file must have .png extension');
  });

  it('should throw error if screencap command fails', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValueOnce({
      success: false,
      stdout: '',
      stderr: 'Failed to capture screenshot',
    } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);

    await expect(captureScreenshot(input)).rejects.toThrow(
      'Failed to capture screenshot on device'
    );
  });

  it('should throw error if pull command fails', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute
      .mockResolvedValueOnce({ success: true, stdout: '', stderr: '' } as ADBExecutionResult)
      .mockResolvedValueOnce({
        success: false,
        stdout: '',
        stderr: 'Failed to pull file',
      } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);

    await expect(captureScreenshot(input)).rejects.toThrow('Failed to pull screenshot from device');
  });

  it('should throw error if output directory creation fails', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshots/test.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockMkdir.mockRejectedValueOnce(new Error('Permission denied'));

    await expect(captureScreenshot(input)).rejects.toThrow('Failed to create output directory');
  });

  it('should clean up temp file even if stat fails', async () => {
    const input: CaptureScreenshotInput = {
      output_path: '/tmp/screenshot.png',
    };

    mockListDevices.mockResolvedValue([{ id: 'emulator-5554', state: 'device' }] as DeviceInfo[]);
    mockExecute.mockResolvedValue({ success: true, stdout: '', stderr: '' } as ADBExecutionResult);

    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockRejectedValueOnce(new Error('File not found'));

    const result = await captureScreenshot(input);

    expect(result.success).toBe(true);
    expect(result.file_size).toBeUndefined();

    // Verify cleanup still happened
    expect(mockExecute).toHaveBeenCalledWith(
      ['-s', 'emulator-5554', 'shell', 'rm', '/sdcard/screenshot_temp.png'],
      expect.any(Object)
    );
  });
});
