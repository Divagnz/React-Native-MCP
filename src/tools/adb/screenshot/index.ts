/**
 * ADB Screenshot Tools
 * @module tools/adb/screenshot
 */

export { captureScreenshot, CaptureScreenshotInputSchema } from './capture-screenshot.js';
export type { CaptureScreenshotInput } from './capture-screenshot.js';

export { compareScreenshots, CompareScreenshotsInputSchema } from './compare-screenshots.js';
export type { CompareScreenshotsInput, ComparisonResult } from './compare-screenshots.js';
