/**
 * Manual mock for pixelmatch library
 * This is needed because pixelmatch is an ES module that Jest can't handle by default
 */

import { jest } from '@jest/globals';

const pixelmatch = jest.fn(
  (
    _img1: Buffer | Uint8Array | Uint8ClampedArray,
    _img2: Buffer | Uint8Array | Uint8ClampedArray,
    _output: Buffer | Uint8Array | Uint8ClampedArray | null,
    _width: number,
    _height: number,
    _options?: {
      threshold?: number;
      includeAA?: boolean;
      alpha?: number;
      aaColor?: [number, number, number];
      diffColor?: [number, number, number];
      diffColorAlt?: [number, number, number];
      diffMask?: boolean;
    }
  ): number => {
    // Default mock implementation returns 0 (no differences)
    return 0;
  }
);

export default pixelmatch;
