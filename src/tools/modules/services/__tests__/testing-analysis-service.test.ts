import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { TestingAnalysisService } from '../testing-analysis-service.js';
import * as fs from 'fs';
import * as path from 'path';

describe('TestingAnalysisService', () => {
  let tempDir: string;

  beforeAll(() => {
    // Create temp test files
    tempDir = path.join(process.cwd(), '__test_temp_testing__');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create unit test file
    const componentsDir = path.join(tempDir, 'components', '__tests__');
    fs.mkdirSync(componentsDir, { recursive: true });
    fs.writeFileSync(
      path.join(componentsDir, 'Button.test.tsx'),
      'import { render } from "@testing-library/react-native"; test("renders", () => {});'
    );

    // Create e2e test file
    const e2eDir = path.join(tempDir, 'e2e');
    fs.mkdirSync(e2eDir, { recursive: true });
    fs.writeFileSync(
      path.join(e2eDir, 'app.test.ts'),
      'import { device } from "detox"; describe("e2e", () => {});'
    );

    // Create integration test file
    const integrationDir = path.join(tempDir, '__integration__');
    fs.mkdirSync(integrationDir, { recursive: true });
    fs.writeFileSync(
      path.join(integrationDir, 'api.test.ts'),
      'describe("integration", () => {});'
    );
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('detectTestTypes', () => {
    it('should detect unit tests', () => {
      const testFiles = [path.join(tempDir, 'components/__tests__/Button.test.tsx')];
      const result = TestingAnalysisService.detectTestTypes(testFiles);

      expect(result).toContain('Unit');
    });

    it('should detect e2e tests', () => {
      const testFiles = [path.join(tempDir, 'e2e/app.test.ts')];
      const result = TestingAnalysisService.detectTestTypes(testFiles);

      expect(result).toContain('E2E');
    });

    it('should detect integration tests', () => {
      const testFiles = [path.join(tempDir, '__integration__/api.test.ts')];
      const result = TestingAnalysisService.detectTestTypes(testFiles);

      expect(result).toContain('Integration');
    });
  });

  describe('analyzeTestingDependencies', () => {
    it('should analyze package.json with jest', () => {
      const packageJson = {
        devDependencies: {
          jest: '^29.0.0',
          '@testing-library/react-native': '^12.0.0',
        },
      };
      const result = TestingAnalysisService.analyzeTestingDependencies(packageJson);

      expect(result.installed).toContain('jest');
      expect(result.installed).toContain('@testing-library/react-native');
    });

    it('should handle missing test dependencies', () => {
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
        },
      };
      const result = TestingAnalysisService.analyzeTestingDependencies(packageJson);

      expect(result.installed.length).toBe(0);
      expect(result.recommended.length).toBeGreaterThan(0);
    });
  });

  describe('getAreaEmoji', () => {
    it('should return emoji for known areas', () => {
      expect(TestingAnalysisService.getAreaEmoji('unit')).toBeTruthy();
      expect(TestingAnalysisService.getAreaEmoji('e2e')).toBeTruthy();
      expect(TestingAnalysisService.getAreaEmoji('integration')).toBeTruthy();
    });

    it('should return default emoji for unknown area', () => {
      const result = TestingAnalysisService.getAreaEmoji('unknown');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getAreaPriority', () => {
    it('should return priority description for areas', () => {
      const result = TestingAnalysisService.getAreaPriority('unit');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
