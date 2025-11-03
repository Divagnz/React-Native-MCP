import { describe, it, expect } from '@jest/globals';
import { VersionManagementService } from '../version-management-service.js';

describe('VersionManagementService', () => {
  describe('compareVersions', () => {
    it('should detect when current is less than latest', () => {
      const result = VersionManagementService.compareVersions('1.0.0', '2.0.0');
      expect(result).toBeLessThan(0);
    });

    it('should detect when current equals latest', () => {
      const result = VersionManagementService.compareVersions('1.0.0', '1.0.0');
      expect(result).toBe(0);
    });

    it('should detect when current is greater than latest', () => {
      const result = VersionManagementService.compareVersions('2.0.0', '1.0.0');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle minor version differences', () => {
      const result = VersionManagementService.compareVersions('1.1.0', '1.2.0');
      expect(result).toBeLessThan(0);
    });

    it('should handle patch version differences', () => {
      const result = VersionManagementService.compareVersions('1.0.1', '1.0.2');
      expect(result).toBeLessThan(0);
    });
  });
});
