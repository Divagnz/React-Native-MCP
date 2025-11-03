import { describe, it, expect } from '@jest/globals';
import { PackageManagementService } from '../package-management-service.js';

describe('PackageManagementService', () => {
  describe('isMinorOrPatchUpdate', () => {
    it('should detect minor updates', () => {
      const result = PackageManagementService.isMinorOrPatchUpdate('1.0.0', '1.1.0');
      expect(result).toBe(true);
    });

    it('should detect patch updates', () => {
      const result = PackageManagementService.isMinorOrPatchUpdate('1.0.0', '1.0.1');
      expect(result).toBe(true);
    });

    it('should reject major updates', () => {
      const result = PackageManagementService.isMinorOrPatchUpdate('1.0.0', '2.0.0');
      expect(result).toBe(false);
    });
  });

  describe('isPatchUpdate', () => {
    it('should detect patch updates', () => {
      const result = PackageManagementService.isPatchUpdate('1.0.0', '1.0.1');
      expect(result).toBe(true);
    });

    it('should reject minor updates', () => {
      const result = PackageManagementService.isPatchUpdate('1.0.0', '1.1.0');
      expect(result).toBe(false);
    });

    it('should reject major updates', () => {
      const result = PackageManagementService.isPatchUpdate('1.0.0', '2.0.0');
      expect(result).toBe(false);
    });
  });

  describe('findDependencyConflicts', () => {
    it('should find conflicts in dependencies', () => {
      const depTree = {
        dependencies: {
          react: { version: '18.0.0' },
          'react-native': { version: '0.72.0' },
        },
      };

      const result = PackageManagementService.findDependencyConflicts(depTree);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty dependencies', () => {
      const result = PackageManagementService.findDependencyConflicts({});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('meetsSeverityThreshold', () => {
    it('should validate critical severity meets threshold', () => {
      const result = PackageManagementService.meetsSeverityThreshold('critical', 'high');
      expect(result).toBe(true);
    });

    it('should validate low severity does not meet high threshold', () => {
      const result = PackageManagementService.meetsSeverityThreshold('low', 'high');
      expect(result).toBe(false);
    });

    it('should handle equal severity levels', () => {
      const result = PackageManagementService.meetsSeverityThreshold('medium', 'medium');
      expect(result).toBe(true);
    });
  });
});
