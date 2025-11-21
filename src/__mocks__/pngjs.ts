/**
 * Manual mock for pngjs library
 */

import { jest } from '@jest/globals';

export const mockPNGRead = jest.fn();
export const mockPNGWrite = jest.fn();

export const PNG = Object.assign(
  jest.fn(() => ({
    width: 100,
    height: 100,
    data: Buffer.alloc(100 * 100 * 4),
  })),
  {
    sync: {
      read: mockPNGRead,
      write: mockPNGWrite,
    },
  }
);
