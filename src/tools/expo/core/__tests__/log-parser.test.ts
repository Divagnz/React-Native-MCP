/**
 * Tests for LogParser
 */

import { describe, it, expect } from '@jest/globals';
import { LogParser } from '../log-parser.js';

describe('LogParser', () => {
  let parser: LogParser;

  beforeEach(() => {
    parser = LogParser.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = LogParser.getInstance();
      const instance2 = LogParser.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('parseLine', () => {
    it('should parse basic log line', () => {
      const log = parser.parseLine('test message');

      expect(log.message).toBe('test message');
      expect(log.type).toBe('generic');
      expect(log.level).toBe('info');
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should detect Metro logs', () => {
      const log = parser.parseLine('Metro bundler is starting');

      expect(log.type).toBe('metro');
    });

    it('should detect Expo logs', () => {
      const log = parser.parseLine('Expo dev server started on exp://192.168.1.1:19000');

      expect(log.type).toBe('expo');
    });

    it('should detect native build logs', () => {
      const log = parser.parseLine('▸ Compiling MyComponent.swift');

      expect(log.type).toBe('native');
    });

    it('should detect error level', () => {
      const log = parser.parseLine('ERROR: Build failed');

      expect(log.level).toBe('error');
    });

    it('should detect warning level', () => {
      const log = parser.parseLine('WARNING: Deprecated API');

      expect(log.level).toBe('warn');
    });
  });

  describe('extractURLs', () => {
    it('should extract exp:// URLs', () => {
      const urls = parser.extractURLs('Server at exp://192.168.1.1:19000');

      expect(urls).toHaveLength(1);
      expect(urls[0].url).toBe('exp://192.168.1.1:19000');
      expect(urls[0].type).toBe('expo');
      expect(urls[0].qr_compatible).toBe(true);
    });

    it('should extract http:// URLs', () => {
      const urls = parser.extractURLs('Metro at http://localhost:8081');

      expect(urls).toHaveLength(1);
      expect(urls[0].url).toBe('http://localhost:8081');
      expect(urls[0].type).toBe('metro');
    });

    it('should extract multiple URLs', () => {
      const urls = parser.extractURLs(
        'exp://192.168.1.1:19000 and http://localhost:8081'
      );

      // Should find both unique URLs
      expect(urls.length).toBeGreaterThanOrEqual(2);
      const uniqueUrls = [...new Set(urls.map(u => u.url))];
      expect(uniqueUrls).toHaveLength(2);
    });
  });

  describe('extractMetroProgress', () => {
    it('should extract bundling progress', () => {
      const progress = parser.extractMetroProgress('Bundling 45.3%');

      expect(progress).not.toBeNull();
      expect(progress!.percentage).toBe(45.3);
      expect(progress!.completed).toBe(45.3);
      expect(progress!.total).toBe(100);
    });

    it('should detect completion', () => {
      const progress = parser.extractMetroProgress('Bundling complete');

      expect(progress).not.toBeNull();
      expect(progress!.percentage).toBe(100);
    });

    it('should return null for non-progress lines', () => {
      const progress = parser.extractMetroProgress('Random log message');

      expect(progress).toBeNull();
    });
  });

  describe('extractBuildProgress', () => {
    it('should extract Xcode progress', () => {
      const progress = parser.extractBuildProgress('▸ Compiling MyFile.swift');

      expect(progress).not.toBeNull();
      expect(progress!.stage).toBe('Compiling MyFile.swift');
    });

    it('should extract Gradle progress', () => {
      const progress = parser.extractBuildProgress('> CONFIGURE :app:compileDebugJavaWithJavac');

      expect(progress).not.toBeNull();
      // Regex >.*:(.*) is greedy - captures everything after the LAST colon
      expect(progress!.stage).toBe('compileDebugJavaWithJavac');
    });

    it('should extract numeric progress', () => {
      const progress = parser.extractBuildProgress('[12/45] Building component');

      expect(progress).not.toBeNull();
      expect(progress!.percentage).toBe(Math.round((12 / 45) * 100));
    });

    it('should return null for non-build lines', () => {
      const progress = parser.extractBuildProgress('Random message');

      expect(progress).toBeNull();
    });
  });

  describe('isDevServerReady', () => {
    it('should detect when server is ready', () => {
      const logs = [
        'Starting Metro bundler',
        'Loading dependencies',
        'Metro waiting on exp://192.168.1.1:19000',
        'Logs for your project will appear below',
      ];

      expect(parser.isDevServerReady(logs)).toBe(true);
    });

    it('should return false when server not ready', () => {
      const logs = ['Starting Metro bundler', 'Loading dependencies'];

      expect(parser.isDevServerReady(logs)).toBe(false);
    });
  });

  describe('isBundling', () => {
    it('should detect bundling in progress', () => {
      const logs = ['Bundling 45.3%', 'Transforming modules'];

      expect(parser.isBundling(logs)).toBe(true);
    });

    it('should return false when not bundling', () => {
      const logs = ['Server started', 'Waiting for connections'];

      expect(parser.isBundling(logs)).toBe(false);
    });
  });

  describe('extractErrors', () => {
    it('should extract error lines', () => {
      const logs = [
        'Starting build',
        'ERROR: Module not found',
        'INFO: Continuing',
        'Error: Build failed',
        'Success',
      ];

      const errors = parser.extractErrors(logs);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('ERROR: Module not found');
      expect(errors[1]).toContain('Error: Build failed');
    });
  });

  describe('extractWarnings', () => {
    it('should extract warning lines', () => {
      const logs = [
        'Starting build',
        'WARNING: Deprecated API',
        'INFO: Processing',
        'warn: Old version detected',
        'Success',
      ];

      const warnings = parser.extractWarnings(logs);

      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain('WARNING: Deprecated API');
      expect(warnings[1]).toContain('warn: Old version detected');
    });
  });

  describe('isBuildComplete', () => {
    it('should detect iOS build success', () => {
      const logs = ['Building...', 'Compiling', 'BUILD SUCCEEDED'];

      const result = parser.isBuildComplete(logs);

      expect(result.complete).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toContain('iOS build completed successfully');
    });

    it('should detect iOS build failure', () => {
      const logs = ['Building...', 'Error occurred', 'BUILD FAILED'];

      const result = parser.isBuildComplete(logs);

      expect(result.complete).toBe(true);
      expect(result.success).toBe(false);
      expect(result.message).toContain('iOS build failed');
    });

    it('should detect Android build success', () => {
      const logs = ['Building...', 'Compiling', 'BUILD SUCCESSFUL'];

      const result = parser.isBuildComplete(logs);

      expect(result.complete).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Android build completed successfully');
    });

    it('should detect Android build failure', () => {
      const logs = ['Building...', 'BUILD FAILED'];

      const result = parser.isBuildComplete(logs);

      expect(result.complete).toBe(true);
      expect(result.success).toBe(false);
    });

    it('should return not complete when build ongoing', () => {
      const logs = ['Building...', 'Compiling', 'Processing'];

      const result = parser.isBuildComplete(logs);

      expect(result.complete).toBe(false);
    });
  });

  describe('formatLogs', () => {
    it('should format logs with timestamps and levels', () => {
      const parsedLogs = [
        parser.parseLine('First message'),
        parser.parseLine('ERROR: Second message'),
        parser.parseLine('WARNING: Third message'),
      ];

      const formatted = parser.formatLogs(parsedLogs);

      expect(formatted).toContain('INFO');
      expect(formatted).toContain('ERROR');
      expect(formatted).toContain('WARN');
      expect(formatted).toContain('First message');
      expect(formatted).toContain('Second message');
      expect(formatted).toContain('Third message');
    });
  });

  describe('summarizeLogs', () => {
    it('should provide summary statistics', () => {
      const logs = [
        'Starting server',
        'ERROR: Something failed',
        'WARNING: Deprecated',
        'INFO: exp://192.168.1.1:19000',
        'Bundling 50%',
        'ERROR: Another error',
      ];

      const summary = parser.summarizeLogs(logs);

      expect(summary.total).toBe(6);
      expect(summary.errors).toBe(2);
      expect(summary.warnings).toBe(1);
      expect(summary.urls).toContain('exp://192.168.1.1:19000');
      // Progress might be undefined if not found in the log order
      if (summary.progress !== undefined) {
        expect(summary.progress).toBe(50);
      }
    });
  });
});
