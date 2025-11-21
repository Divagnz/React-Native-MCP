/**
 * ADB Compare Screenshots Tool
 * Compare two screenshots for visual differences
 * @module tools/adb/screenshot/compare-screenshots
 */

import { z } from 'zod';
import { validateFilePath } from '../utils/index.js';
import { withErrorHandling, ADBError } from '../../../errors/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Input schema for compare_screenshots tool
 */
export const CompareScreenshotsInputSchema = z.object({
  baseline_path: z.string().describe('Path to the baseline/reference screenshot'),
  current_path: z.string().describe('Path to the current/test screenshot'),
  diff_output_path: z
    .string()
    .optional()
    .describe('Path to save the diff image (optional, highlights differences in red)'),
  threshold: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Difference threshold (0-1, default: 0.1). Lower = more sensitive'),
  ignore_antialiasing: z
    .boolean()
    .optional()
    .describe('Ignore anti-aliasing differences (default: true)'),
});

export type CompareScreenshotsInput = z.infer<typeof CompareScreenshotsInputSchema>;

/**
 * Screenshot comparison result
 */
export interface ComparisonResult {
  identical: boolean;
  mismatch_percentage: number;
  diff_pixels: number;
  total_pixels: number;
  baseline_path: string;
  current_path: string;
  diff_output_path?: string;
  dimensions: {
    baseline: { width: number; height: number };
    current: { width: number; height: number };
  };
  message: string;
}

/**
 * Compare two screenshots for visual differences
 *
 * Common workflows:
 * - Visual regression testing: Compare current UI against baseline
 * - Bug detection: Identify unintended visual changes
 * - Cross-device testing: Compare same app on different devices
 * - A/B testing: Compare different UI variations
 *
 * The tool uses pixelmatch algorithm which:
 * - Detects pixel-level differences
 * - Optionally ignores anti-aliasing
 * - Generates diff image highlighting changes in red
 * - Returns mismatch percentage for automated testing
 *
 * @param input - Screenshot comparison configuration
 * @returns Comparison result with mismatch metrics
 */
export async function compareScreenshots(input: CompareScreenshotsInput) {
  return withErrorHandling(async () => {
    const {
      baseline_path,
      current_path,
      diff_output_path,
      threshold = 0.1,
      ignore_antialiasing = true,
    } = input;

    // Validate paths
    validateFilePath(baseline_path);
    validateFilePath(current_path);
    if (diff_output_path) {
      validateFilePath(diff_output_path);
    }

    // Verify files exist
    try {
      await fs.access(baseline_path);
    } catch {
      throw new ADBError('Baseline screenshot file not found', { baseline_path });
    }

    try {
      await fs.access(current_path);
    } catch {
      throw new ADBError('Current screenshot file not found', { current_path });
    }

    // Read and decode baseline image
    let baselineImage: PNG;
    try {
      const baselineBuffer = await fs.readFile(baseline_path);
      baselineImage = PNG.sync.read(baselineBuffer);
    } catch (error) {
      throw new ADBError('Failed to read baseline screenshot', {
        baseline_path,
        error: (error as Error).message,
      });
    }

    // Read and decode current image
    let currentImage: PNG;
    try {
      const currentBuffer = await fs.readFile(current_path);
      currentImage = PNG.sync.read(currentBuffer);
    } catch (error) {
      throw new ADBError('Failed to read current screenshot', {
        current_path,
        error: (error as Error).message,
      });
    }

    // Check dimensions match
    const baselineWidth = baselineImage.width;
    const baselineHeight = baselineImage.height;
    const currentWidth = currentImage.width;
    const currentHeight = currentImage.height;

    if (baselineWidth !== currentWidth || baselineHeight !== currentHeight) {
      throw new ADBError('Screenshot dimensions do not match', {
        baseline: { width: baselineWidth, height: baselineHeight },
        current: { width: currentWidth, height: currentHeight },
      });
    }

    // Create diff image
    const diffImage = new PNG({ width: baselineWidth, height: baselineHeight });

    // Compare images
    const diffPixels = pixelmatch(
      baselineImage.data,
      currentImage.data,
      diffImage.data,
      baselineWidth,
      baselineHeight,
      {
        threshold,
        includeAA: !ignore_antialiasing,
      }
    );

    const totalPixels = baselineWidth * baselineHeight;
    const mismatchPercentage = (diffPixels / totalPixels) * 100;

    // Save diff image if path provided
    if (diff_output_path && diffPixels > 0) {
      try {
        const diffOutputDir = path.dirname(diff_output_path);
        await fs.mkdir(diffOutputDir, { recursive: true });

        const diffBuffer = PNG.sync.write(diffImage);
        await fs.writeFile(diff_output_path, diffBuffer);
      } catch (error) {
        throw new ADBError('Failed to save diff image', {
          diff_output_path,
          error: (error as Error).message,
        });
      }
    }

    const identical = diffPixels === 0;

    return {
      identical,
      mismatch_percentage: parseFloat(mismatchPercentage.toFixed(4)),
      diff_pixels: diffPixels,
      total_pixels: totalPixels,
      baseline_path,
      current_path,
      diff_output_path: diffPixels > 0 ? diff_output_path : undefined,
      dimensions: {
        baseline: { width: baselineWidth, height: baselineHeight },
        current: { width: currentWidth, height: currentHeight },
      },
      message: identical
        ? 'Screenshots are identical'
        : `Screenshots differ by ${mismatchPercentage.toFixed(2)}% (${diffPixels} of ${totalPixels} pixels)`,
    };
  }, 'compare screenshots');
}
