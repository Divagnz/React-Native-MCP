import { describe, it, expect } from '@jest/globals';
import { VersionUtils } from '../version-utils.js';

describe('VersionUtils', () => {
  describe('compareVersions', () => {
    it('should return -1 when current version is less than latest', () => {
      expect(VersionUtils.compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(VersionUtils.compareVersions('1.2.3', '1.2.4')).toBe(-1);
      expect(VersionUtils.compareVersions('0.9.0', '1.0.0')).toBe(-1);
    });

    it('should return 0 when versions are equal', () => {
      expect(VersionUtils.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(VersionUtils.compareVersions('2.5.3', '2.5.3')).toBe(0);
      expect(VersionUtils.compareVersions('0.0.1', '0.0.1')).toBe(0);
    });

    it('should return 1 when current version is greater than latest', () => {
      expect(VersionUtils.compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(VersionUtils.compareVersions('1.2.4', '1.2.3')).toBe(1);
      expect(VersionUtils.compareVersions('1.0.0', '0.9.0')).toBe(1);
    });

    it('should handle versions with different lengths', () => {
      expect(VersionUtils.compareVersions('1.0', '1.0.0')).toBe(0);
      expect(VersionUtils.compareVersions('1.0.0', '1.0')).toBe(0);
      expect(VersionUtils.compareVersions('1.0', '1.0.1')).toBe(-1);
      expect(VersionUtils.compareVersions('1.0.1', '1.0')).toBe(1);
    });

    it('should compare major versions correctly', () => {
      expect(VersionUtils.compareVersions('1.9.9', '2.0.0')).toBe(-1);
      expect(VersionUtils.compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should compare minor versions correctly', () => {
      expect(VersionUtils.compareVersions('1.9.0', '1.10.0')).toBe(-1);
      expect(VersionUtils.compareVersions('1.10.0', '1.9.0')).toBe(1);
    });

    it('should compare patch versions correctly', () => {
      expect(VersionUtils.compareVersions('1.0.9', '1.0.10')).toBe(-1);
      expect(VersionUtils.compareVersions('1.0.10', '1.0.9')).toBe(1);
    });
  });

  describe('isMinorOrPatchUpdate', () => {
    it('should return true for minor updates', () => {
      expect(VersionUtils.isMinorOrPatchUpdate('1.0.0', '1.1.0')).toBe(true);
      expect(VersionUtils.isMinorOrPatchUpdate('2.5.0', '2.6.0')).toBe(true);
    });

    it('should return true for patch updates', () => {
      expect(VersionUtils.isMinorOrPatchUpdate('1.0.0', '1.0.1')).toBe(true);
      expect(VersionUtils.isMinorOrPatchUpdate('2.5.3', '2.5.4')).toBe(true);
    });

    it('should return false for major updates', () => {
      expect(VersionUtils.isMinorOrPatchUpdate('1.0.0', '2.0.0')).toBe(false);
      expect(VersionUtils.isMinorOrPatchUpdate('1.9.9', '2.0.0')).toBe(false);
      expect(VersionUtils.isMinorOrPatchUpdate('0.9.0', '1.0.0')).toBe(false);
    });

    it('should return true when versions are equal', () => {
      expect(VersionUtils.isMinorOrPatchUpdate('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return true for combined minor and patch updates', () => {
      expect(VersionUtils.isMinorOrPatchUpdate('1.0.0', '1.1.1')).toBe(true);
      expect(VersionUtils.isMinorOrPatchUpdate('2.3.0', '2.5.2')).toBe(true);
    });
  });

  describe('isPatchUpdate', () => {
    it('should return true for patch updates only', () => {
      expect(VersionUtils.isPatchUpdate('1.0.0', '1.0.1')).toBe(true);
      expect(VersionUtils.isPatchUpdate('2.5.3', '2.5.4')).toBe(true);
      expect(VersionUtils.isPatchUpdate('0.0.1', '0.0.2')).toBe(true);
    });

    it('should return false for minor updates', () => {
      expect(VersionUtils.isPatchUpdate('1.0.0', '1.1.0')).toBe(false);
      expect(VersionUtils.isPatchUpdate('2.5.0', '2.6.0')).toBe(false);
    });

    it('should return false for major updates', () => {
      expect(VersionUtils.isPatchUpdate('1.0.0', '2.0.0')).toBe(false);
      expect(VersionUtils.isPatchUpdate('0.9.0', '1.0.0')).toBe(false);
    });

    it('should return false for combined updates', () => {
      expect(VersionUtils.isPatchUpdate('1.0.0', '1.1.1')).toBe(false);
      expect(VersionUtils.isPatchUpdate('1.0.0', '2.0.1')).toBe(false);
    });

    it('should return true when versions are equal', () => {
      expect(VersionUtils.isPatchUpdate('1.0.0', '1.0.0')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle single-digit versions', () => {
      expect(VersionUtils.compareVersions('1', '2')).toBe(-1);
      expect(VersionUtils.compareVersions('2', '1')).toBe(1);
      expect(VersionUtils.compareVersions('1', '1')).toBe(0);
    });

    it('should handle two-digit versions', () => {
      expect(VersionUtils.compareVersions('1.0', '1.1')).toBe(-1);
      expect(VersionUtils.compareVersions('1.1', '1.0')).toBe(1);
    });

    it('should handle version 0.0.0', () => {
      expect(VersionUtils.compareVersions('0.0.0', '0.0.1')).toBe(-1);
      expect(VersionUtils.isMinorOrPatchUpdate('0.0.0', '0.0.1')).toBe(true);
      expect(VersionUtils.isPatchUpdate('0.0.0', '0.0.1')).toBe(true);
    });
  });
});
