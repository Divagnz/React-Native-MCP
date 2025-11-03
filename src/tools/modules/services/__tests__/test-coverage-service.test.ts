import { describe, it, expect } from '@jest/globals';
import { TestCoverageService } from '../test-coverage-service.js';

describe('TestCoverageService', () => {
  describe('parseCoverageOutput', () => {
    it('should parse coverage output with summary', () => {
      const mockOutput = `
File      % Stmts % Branch % Funcs % Lines
----------|---------|---------|---------|---------|
All files |   85.5  |   80.2  |   90.1  |   85.5  |
      `;
      const result = TestCoverageService.parseCoverageOutput(mockOutput, 80);

      expect(result).toContain('Coverage Summary');
      expect(result).toContain('85.5');
    });

    it('should handle output without coverage data', () => {
      const mockOutput = 'No coverage data found';
      const result = TestCoverageService.parseCoverageOutput(mockOutput, 80);

      expect(result).toContain('Coverage Report');
    });
  });

  describe('generateCoverageRecommendations', () => {
    it('should generate recommendations for coverage threshold', () => {
      const result = TestCoverageService.generateCoverageRecommendations(80);

      expect(result).toContain('Coverage');
      expect(result).toContain('80');
    });

    it('should provide actionable suggestions', () => {
      const result = TestCoverageService.generateCoverageRecommendations(90);

      expect(result.length).toBeGreaterThan(0);
      expect(typeof result).toBe('string');
    });
  });
});
