/**
 * File scanning utilities for React Native projects
 */
import * as fs from 'fs';
import * as path from 'path';

export class FileScanner {
  /**
   * Directories to skip when scanning
   */
  private static readonly SKIP_DIRS = [
    'node_modules',
    '.git',
    'ios',
    'android',
    '.expo',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.vscode',
    '.idea',
    'tmp',
    'temp',
    'logs',
    'log',
    'cache',
    '.cache',
    '.turbo',
  ];

  /**
   * Find all React Native files in a project
   * @param projectPath - Root path of the project to scan
   * @returns Array of file paths
   */
  static async findReactNativeFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = async (dir: string, depth: number = 0): Promise<void> => {
      try {
        // Prevent scanning too deep to avoid performance issues
        if (depth > 10) {
          return;
        }

        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!this.SKIP_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
              await scanDirectory(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            if (this.isReactNativeFile(entry.name)) {
              // Additional check: read first few lines to confirm it's React/React Native
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const firstLines = content.substring(0, 500);

                if (this.isReactRelated(firstLines)) {
                  files.push(fullPath);
                }
              } catch {
                // If we can't read the file, skip it
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDirectory(projectPath);
    return files;
  }

  /**
   * Find test files in a project
   * @param projectPath - Root path of the project to scan
   * @returns Array of test file paths
   */
  static async findTestFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = async (dir: string, depth: number = 0): Promise<void> => {
      try {
        if (depth > 10) {
          return;
        }

        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!this.SKIP_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
              await scanDirectory(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            // Check if it's a test file by name OR if it's in a __tests__ directory
            if (this.isTestFile(entry.name) || fullPath.includes('__tests__')) {
              // Only include .ts, .tsx, .js, .jsx files
              if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
                files.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDirectory(projectPath);
    return files;
  }

  /**
   * Check if a filename is a React Native file
   */
  private static isReactNativeFile(fileName: string): boolean {
    return (
      /\.(js|jsx|ts|tsx)$/.test(fileName) &&
      !fileName.includes('.test.') &&
      !fileName.includes('.spec.') &&
      !fileName.includes('.d.ts') &&
      !fileName.includes('.config.') &&
      !fileName.endsWith('.min.js')
    );
  }

  /**
   * Check if a filename is a test file
   */
  private static isTestFile(fileName: string): boolean {
    return (
      /\.(js|jsx|ts|tsx)$/.test(fileName) &&
      (fileName.includes('.test.') || fileName.includes('.spec.') || fileName.includes('__tests__'))
    );
  }

  /**
   * Check if file content is React-related
   */
  private static isReactRelated(content: string): boolean {
    // Must have React import AND either JSX or React Native import
    const hasReactImport = /import\s+.*React.*from\s+['"]react['"]/i.test(content);
    const hasRNImport = /from\s+['"]react-native['"]/i.test(content);
    const hasJSXElements = /<[A-Z]\w*[\s\S]*?>/m.test(content);

    return (hasReactImport || hasRNImport) && (hasJSXElements || hasRNImport);
  }
}
