/**
 * ADB Capture Screenshot Tool
 * Capture a screenshot from an Android device
 * @module tools/adb/screenshot/capture-screenshot
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validateFilePath } from '../utils/index.js';
import {
  withErrorHandling,
  ADBError,
  DeviceNotFoundError,
  ScreenshotError,
} from '../../../errors/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Input schema for capture_screenshot tool
 */
export const CaptureScreenshotInputSchema = z.object({
  output_path: z.string().describe('Local path to save the screenshot (e.g., ./screenshot.png)'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (uses first available if not specified)'),
  format: z
    .enum(['png', 'raw'])
    .optional()
    .describe('Screenshot format: png (compressed) or raw (uncompressed, default: png)'),
  display_id: z.number().optional().describe('Display ID for multi-display devices (default: 0)'),
});

export type CaptureScreenshotInput = z.infer<typeof CaptureScreenshotInputSchema>;

/**
 * Capture a screenshot from an Android device
 *
 * Common workflows:
 * - UI testing: Capture screenshots for visual regression testing
 * - Documentation: Take screenshots of app screens for documentation
 * - Bug reporting: Capture device state for bug reports
 * - Multi-display: Use display_id to capture from specific display
 *
 * @param input - Screenshot capture configuration
 * @returns Screenshot capture result with file info
 */
export async function captureScreenshot(input: CaptureScreenshotInput) {
  return withErrorHandling(async () => {
    const { output_path, device_id, format = 'png', display_id = 0 } = input;

    // Validate output path
    validateFilePath(output_path);

    // Ensure output directory exists
    const outputDir = path.dirname(output_path);
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new ADBError('Failed to create output directory', {
        output_path,
        error: (error as Error).message,
      });
    }

    // Validate file extension
    const ext = path.extname(output_path).toLowerCase();
    if (ext !== '.png') {
      throw new ADBError('Output file must have .png extension', {
        output_path,
        extension: ext,
      });
    }

    const client = getADBClient();

    // Get target device
    let targetDevice = device_id;
    if (!targetDevice) {
      const devices = await client.listDevices(false);
      if (devices.length === 0) {
        throw new DeviceNotFoundError('No devices connected');
      }
      targetDevice = devices[0].id;
    } else {
      // Verify device exists
      const devices = await client.listDevices(false);
      if (!devices.find((d) => d.id === targetDevice)) {
        throw new DeviceNotFoundError(`Device ${targetDevice} not found`);
      }
    }

    // Build screenshot command
    // Use screencap command which outputs to stdout
    const devicePath = '/sdcard/screenshot_temp.png';
    const screencapArgs = ['-s', targetDevice, 'shell', 'screencap'];

    if (format === 'png') {
      screencapArgs.push('-p');
    }

    if (display_id !== 0) {
      screencapArgs.push('-d', display_id.toString());
    }

    screencapArgs.push(devicePath);

    // Capture screenshot on device
    const screencapResult = await client.execute(screencapArgs, {
      timeout: 15000,
      throw_on_error: false,
    });

    if (!screencapResult.success) {
      throw new ScreenshotError('Failed to capture screenshot on device', {
        device_id: targetDevice,
        error_output: screencapResult.stderr,
      });
    }

    // Pull screenshot from device
    const pullArgs = ['-s', targetDevice, 'pull', devicePath, output_path];
    const pullResult = await client.execute(pullArgs, {
      timeout: 30000,
      throw_on_error: false,
    });

    if (!pullResult.success) {
      throw new ScreenshotError('Failed to pull screenshot from device', {
        device_id: targetDevice,
        device_path: devicePath,
        output_path,
        error_output: pullResult.stderr,
      });
    }

    // Clean up temp file on device
    await client.execute(['-s', targetDevice, 'shell', 'rm', devicePath], {
      timeout: 5000,
      throw_on_error: false,
    });

    // Get file stats
    let fileSize: number | undefined;
    try {
      const stats = await fs.stat(output_path);
      fileSize = stats.size;
    } catch {
      // File size is optional
    }

    return {
      success: true,
      device_id: targetDevice,
      output_path,
      file_size: fileSize,
      format,
      display_id,
      message: `Screenshot captured from ${targetDevice} and saved to ${output_path}`,
    };
  }, 'capture screenshot from device');
}
