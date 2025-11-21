/**
 * Tests for ADB Compare Screenshots Tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { compareScreenshots } from '../compare-screenshots.js';
import type { CompareScreenshotsInput } from '../compare-screenshots.js';
import * as fs from 'fs/promises';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Mock dependencies
jest.mock('fs/promises');
const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;

// pixelmatch and pngjs are automatically mocked via moduleNameMapper in jest.config.js
const mockPixelmatch = pixelmatch as jest.MockedFunction<typeof pixelmatch>;

// Access the mock functions from the mocked PNG module
const mockPNGRead = (PNG as any).sync.read as jest.MockedFunction<any>;
const mockPNGWrite = (PNG as any).sync.write as jest.MockedFunction<any>;

describe('compareScreenshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockPNGRead.mockReturnValue({
      width: 100,
      height: 100,
      data: Buffer.alloc(100 * 100 * 4),
    });
    mockPNGWrite.mockReturnValue(Buffer.from('diff image data'));
  });

  it('should detect identical screenshots', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
    };

    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('mock png data'));
    (mockPixelmatch as any).mockReturnValue(0);

    const result = await compareScreenshots(input);

    expect(result.identical).toBe(true);
    expect(result.mismatch_percentage).toBe(0);
    expect(result.diff_pixels).toBe(0);
    expect(result.total_pixels).toBe(10000);
    expect(result.message).toContain('identical');
  });

  it('should detect differences between screenshots', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
      diff_output_path: '/tmp/diff.png',
    };

    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('mock png data'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    (mockPixelmatch as any).mockReturnValue(500);

    const result = await compareScreenshots(input);

    expect(result.identical).toBe(false);
    expect(result.mismatch_percentage).toBe(5);
    expect(result.diff_pixels).toBe(500);
    expect(result.total_pixels).toBe(10000);
    expect(result.diff_output_path).toBe('/tmp/diff.png');
    expect(result.message).toContain('5.00%');

    expect(mockWriteFile).toHaveBeenCalledWith('/tmp/diff.png', expect.any(Buffer));
  });

  it('should use custom threshold', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
      threshold: 0.5,
    };

    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('mock png data'));
    (mockPixelmatch as any).mockReturnValue(0);

    await compareScreenshots(input);

    expect(mockPixelmatch).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(Buffer),
      expect.any(Buffer),
      100,
      100,
      expect.objectContaining({
        threshold: 0.5,
      })
    );
  });

  it('should not save diff image if screenshots are identical', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
      diff_output_path: '/tmp/diff.png',
    };

    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('mock png data'));
    (mockPixelmatch as any).mockReturnValue(0);

    const result = await compareScreenshots(input);

    expect(result.diff_output_path).toBeUndefined();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should throw error if baseline file not found', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
    };

    mockAccess.mockRejectedValueOnce(new Error('File not found'));

    await expect(compareScreenshots(input)).rejects.toThrow('Baseline screenshot file not found');
  });

  it('should throw error if dimensions do not match', async () => {
    const input: CompareScreenshotsInput = {
      baseline_path: '/tmp/baseline.png',
      current_path: '/tmp/current.png',
    };

    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('mock png data'));

    mockPNGRead
      .mockReturnValueOnce({
        width: 100,
        height: 100,
        data: Buffer.alloc(100 * 100 * 4),
      })
      .mockReturnValueOnce({
        width: 200,
        height: 200,
        data: Buffer.alloc(200 * 200 * 4),
      });

    await expect(compareScreenshots(input)).rejects.toThrow('Screenshot dimensions do not match');
  });
});
