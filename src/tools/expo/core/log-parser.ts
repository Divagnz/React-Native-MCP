/**
 * Log Parser
 *
 * Parses Metro bundler, Expo dev server, and native build logs to extract
 * useful information like progress, errors, warnings, and URLs.
 */

import { logger } from '../../../utils/logger.js';
import {
  ParsedLog,
  LogLevel,
  MetroProgress,
  BuildProgress,
  ExtractedURL,
} from '../types.js';
import { LOG_PATTERNS } from '../constants.js';

/**
 * Parses and analyzes logs from various Expo/Metro/Native processes
 */
export class LogParser {
  private static instance: LogParser;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): LogParser {
    if (!LogParser.instance) {
      LogParser.instance = new LogParser();
    }
    return LogParser.instance;
  }

  /**
   * Parse raw log line into structured format
   */
  public parseLine(line: string): ParsedLog {
    const timestamp = new Date();
    const level = this.detectLevel(line);
    const type = this.detectType(line);

    return {
      type,
      level,
      message: line.trim(),
      timestamp,
      metadata: this.extractMetadata(line, type),
    };
  }

  /**
   * Parse multiple log lines
   */
  public parseLines(lines: string[]): ParsedLog[] {
    return lines.map((line) => this.parseLine(line));
  }

  /**
   * Detect log type from content
   */
  private detectType(line: string): 'metro' | 'native' | 'expo' | 'generic' {
    if (line.includes('Metro') || line.includes('Bundling')) {
      return 'metro';
    }
    if (line.includes('Xcode') || line.includes('Gradle') || line.includes('▸')) {
      return 'native';
    }
    if (line.includes('Expo') || line.includes('exp://')) {
      return 'expo';
    }
    return 'generic';
  }

  /**
   * Detect log level from content
   */
  private detectLevel(line: string): LogLevel {
    const lower = line.toLowerCase();
    if (LOG_PATTERNS.ERROR.test(lower)) {
      return 'error';
    }
    if (LOG_PATTERNS.WARNING.test(lower)) {
      return 'warn';
    }
    if (lower.includes('debug')) {
      return 'debug';
    }
    return 'info';
  }

  /**
   * Extract metadata from log line
   */
  private extractMetadata(
    line: string,
    type: string
  ): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};

    // Extract URLs
    const urls = this.extractURLs(line);
    if (urls.length > 0) {
      metadata.urls = urls;
    }

    // Extract progress for Metro
    if (type === 'metro') {
      const progress = this.extractMetroProgress(line);
      if (progress) {
        metadata.progress = progress;
      }
    }

    // Extract build progress for native builds
    if (type === 'native') {
      const buildProgress = this.extractBuildProgress(line);
      if (buildProgress) {
        metadata.buildProgress = buildProgress;
      }
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  /**
   * Extract URLs from log line
   */
  public extractURLs(line: string): ExtractedURL[] {
    const urls: ExtractedURL[] = [];
    const seen = new Set<string>();

    // Extract exp:// URLs (Expo dev)
    const expMatches = line.match(LOG_PATTERNS.EXPO_URL);
    if (expMatches) {
      expMatches.forEach((url) => {
        if (!seen.has(url)) {
          seen.add(url);
          urls.push({
            url,
            type: 'expo',
            qr_compatible: true,
          });
        }
      });
    }

    // Extract http:// URLs (Metro)
    const metroMatches = line.match(LOG_PATTERNS.METRO_URL);
    if (metroMatches) {
      metroMatches.forEach((url) => {
        if (!seen.has(url)) {
          seen.add(url);
          urls.push({
            url,
            type: 'metro',
            qr_compatible: true,
          });
        }
      });
    }

    return urls;
  }

  /**
   * Extract Metro bundler progress
   */
  public extractMetroProgress(line: string): MetroProgress | null {
    const match = line.match(/Bundling\s+(\d+\.\d+)%/);
    if (match) {
      const percentage = parseFloat(match[1]);
      return {
        completed: percentage,
        total: 100,
        percentage,
        message: line.trim(),
      };
    }

    // Check for completion
    if (LOG_PATTERNS.METRO_COMPLETE.test(line)) {
      return {
        completed: 100,
        total: 100,
        percentage: 100,
        message: 'Bundling complete',
      };
    }

    return null;
  }

  /**
   * Extract native build progress
   */
  public extractBuildProgress(line: string): BuildProgress | null {
    // Xcode progress (e.g., "▸ Compiling ...")
    const xcodeMatch = line.match(LOG_PATTERNS.XCODE_PROGRESS);
    if (xcodeMatch) {
      return {
        stage: xcodeMatch[1].trim(),
        message: line.trim(),
      };
    }

    // Gradle progress (e.g., "> Task :app:compileDebugJavaWithJavac")
    if (LOG_PATTERNS.GRADLE_PROGRESS.test(line)) {
      const taskMatch = line.match(/>.*:(.*)/);
      return {
        stage: taskMatch ? taskMatch[1] : 'Building',
        message: line.trim(),
      };
    }

    // Generic progress patterns (e.g., "[12/45]")
    const progressMatch = line.match(LOG_PATTERNS.BUILD_PROGRESS);
    if (progressMatch) {
      const [completed, total] = progressMatch[0]
        .replace(/[\[\]]/g, '')
        .split('/')
        .map(Number);
      return {
        stage: 'Building',
        percentage: Math.round((completed / total) * 100),
        message: line.trim(),
      };
    }

    return null;
  }

  /**
   * Check if dev server is ready
   */
  public isDevServerReady(logs: string[]): boolean {
    const recentLogs = logs.slice(-20).join('\n');
    return (
      LOG_PATTERNS.EXPO_READY.test(recentLogs) ||
      recentLogs.includes('Metro.*waiting') ||
      recentLogs.includes('Logs for your project')
    );
  }

  /**
   * Check if bundling is in progress
   */
  public isBundling(logs: string[]): boolean {
    const recentLogs = logs.slice(-10).join('\n');
    return LOG_PATTERNS.METRO_BUNDLING.test(recentLogs);
  }

  /**
   * Extract all errors from logs
   */
  public extractErrors(logs: string[]): string[] {
    return logs
      .filter((log) => LOG_PATTERNS.ERROR.test(log.toLowerCase()))
      .map((log) => log.trim());
  }

  /**
   * Extract all warnings from logs
   */
  public extractWarnings(logs: string[]): string[] {
    return logs
      .filter((log) => LOG_PATTERNS.WARNING.test(log.toLowerCase()))
      .map((log) => log.trim());
  }

  /**
   * Detect build completion
   */
  public isBuildComplete(logs: string[]): {
    complete: boolean;
    success?: boolean;
    message?: string;
  } {
    const recentLogs = logs.slice(-20).join('\n');

    // iOS build success
    if (recentLogs.includes('BUILD SUCCEEDED')) {
      return {
        complete: true,
        success: true,
        message: 'iOS build completed successfully',
      };
    }

    // iOS build failure
    if (recentLogs.includes('BUILD FAILED')) {
      return {
        complete: true,
        success: false,
        message: 'iOS build failed',
      };
    }

    // Android build success
    if (recentLogs.includes('BUILD SUCCESSFUL')) {
      return {
        complete: true,
        success: true,
        message: 'Android build completed successfully',
      };
    }

    // Android build failure
    if (recentLogs.includes('BUILD FAILED')) {
      return {
        complete: true,
        success: false,
        message: 'Android build failed',
      };
    }

    return { complete: false };
  }

  /**
   * Format logs for display
   */
  public formatLogs(parsedLogs: ParsedLog[]): string {
    return parsedLogs
      .map((log) => {
        const timestamp = log.timestamp.toISOString().split('T')[1].split('.')[0];
        const level = log.level.toUpperCase().padEnd(5);
        return `[${timestamp}] ${level} ${log.message}`;
      })
      .join('\n');
  }

  /**
   * Summarize logs
   */
  public summarizeLogs(logs: string[]): {
    total: number;
    errors: number;
    warnings: number;
    urls: string[];
    progress?: number;
  } {
    const errors = this.extractErrors(logs);
    const warnings = this.extractWarnings(logs);
    const urls: string[] = [];

    logs.forEach((log) => {
      const extracted = this.extractURLs(log);
      urls.push(...extracted.map((u) => u.url));
    });

    // Get latest progress
    let latestProgress: number | undefined;
    for (let i = logs.length - 1; i >= 0; i--) {
      const progress = this.extractMetroProgress(logs[i]);
      if (progress) {
        latestProgress = progress.percentage;
        break;
      }
    }

    return {
      total: logs.length,
      errors: errors.length,
      warnings: warnings.length,
      urls: [...new Set(urls)],
      progress: latestProgress,
    };
  }
}

// Export singleton instance
export const logParser = LogParser.getInstance();
