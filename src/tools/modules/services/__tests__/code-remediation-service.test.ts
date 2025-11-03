import { describe, it, expect } from '@jest/globals';
import { CodeRemediationService } from '../code-remediation-service.js';

describe('CodeRemediationService', () => {
  describe('applySecurityFixes', () => {
    it('should fix hardcoded API keys', () => {
      const code = `const apiKey = "abc123";`;
      const appliedFixes: string[] = [];
      const result = CodeRemediationService.applySecurityFixes(code, appliedFixes, false);

      expect(result).toContain('process.env');
      expect(appliedFixes.length).toBeGreaterThan(0);
    });

    it('should fix hardcoded secrets', () => {
      const code = `const mySecret = "secret123";`;
      const appliedFixes: string[] = [];
      const result = CodeRemediationService.applySecurityFixes(code, appliedFixes, false);

      expect(result).toContain('process.env');
      expect(appliedFixes.length).toBeGreaterThan(0);
    });

    it('should upgrade HTTP to HTTPS', () => {
      const code = `fetch('http://api.example.com/data')`;
      const appliedFixes: string[] = [];
      const result = CodeRemediationService.applySecurityFixes(code, appliedFixes, false);

      expect(result).toContain('https://');
      expect(appliedFixes.length).toBeGreaterThan(0);
    });
  });

  describe('applyPerformanceFixes', () => {
    it('should add keyExtractor to FlatList', () => {
      const code = `<FlatList data={items} renderItem={renderItem} />`;
      const appliedFixes: string[] = [];
      const result = CodeRemediationService.applyPerformanceFixes(code, appliedFixes, false);

      expect(result).toContain('keyExtractor');
      expect(appliedFixes.length).toBeGreaterThan(0);
    });
  });

  describe('detectAllIssues', () => {
    it('should detect hardcoded secrets', () => {
      const code = `const apiKey = "abc123";`;
      const issues = CodeRemediationService.detectAllIssues(code);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue) => issue.includes('hardcoded_secrets'))).toBe(true);
    });

    it('should detect HTTP URLs', () => {
      const code = `fetch('http://example.com')`;
      const issues = CodeRemediationService.detectAllIssues(code);

      expect(issues.some((issue) => issue.includes('insecure_http'))).toBe(true);
    });
  });
});
