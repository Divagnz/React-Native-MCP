/**
 * ADB Path Resolver
 * Automatically detects the ADB executable path from various sources
 * @module tools/adb/utils/path-resolver
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { ADBError } from '../../../errors/index.js';

/**
 * Cached ADB path to avoid repeated lookups
 */
let cachedADBPath: string | null = null;

/**
 * Check if a path exists and is executable
 */
function isExecutable(path: string): boolean {
  try {
    if (!existsSync(path)) {
      return false;
    }

    // Check if file is executable by trying to get version
    execSync(`"${path}" version`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe',
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Try to find ADB in PATH environment variable
 */
function findInPath(): string | null {
  try {
    const result = execSync('which adb || where adb', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe',
    }).trim();

    if (result && isExecutable(result)) {
      return result;
    }
  } catch {
    // Command failed, ADB not in PATH
  }

  return null;
}

/**
 * Try to find ADB in ANDROID_HOME
 */
function findInAndroidHome(): string | null {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

  if (!androidHome) {
    return null;
  }

  // Common ADB paths within Android SDK
  const possiblePaths = [
    join(androidHome, 'platform-tools', 'adb'),
    join(androidHome, 'platform-tools', 'adb.exe'), // Windows
  ];

  for (const path of possiblePaths) {
    if (isExecutable(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Try to find ADB in common installation locations
 */
function findInCommonLocations(): string | null {
  const platform = process.platform;
  let commonPaths: string[] = [];

  if (platform === 'darwin') {
    // macOS
    commonPaths = [
      '/usr/local/bin/adb',
      join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/adb'),
      '/opt/homebrew/bin/adb',
    ];
  } else if (platform === 'linux') {
    // Linux
    commonPaths = [
      '/usr/bin/adb',
      '/usr/local/bin/adb',
      join(process.env.HOME || '', 'Android/Sdk/platform-tools/adb'),
      '/opt/android-sdk/platform-tools/adb',
    ];
  } else if (platform === 'win32') {
    // Windows
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';

    commonPaths = [
      join(programFiles, 'Android\\Android Studio\\platform-tools\\adb.exe'),
      join(programFilesX86, 'Android\\Android Studio\\platform-tools\\adb.exe'),
      join(localAppData, 'Android\\Sdk\\platform-tools\\adb.exe'),
      'C:\\adb\\adb.exe',
    ];
  }

  for (const path of commonPaths) {
    if (isExecutable(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Resolve the ADB executable path
 * Tries multiple methods in order:
 * 1. Cached path (if already resolved)
 * 2. PATH environment variable
 * 3. ANDROID_HOME/ANDROID_SDK_ROOT
 * 4. Common installation locations
 *
 * @returns The absolute path to the ADB executable
 * @throws {ADBError} If ADB cannot be found
 */
export function resolveADBPath(): string {
  // Return cached path if available
  if (cachedADBPath) {
    return cachedADBPath;
  }

  // Try PATH first (most reliable)
  let adbPath = findInPath();
  if (adbPath) {
    cachedADBPath = adbPath;
    return adbPath;
  }

  // Try ANDROID_HOME
  adbPath = findInAndroidHome();
  if (adbPath) {
    cachedADBPath = adbPath;
    return adbPath;
  }

  // Try common locations
  adbPath = findInCommonLocations();
  if (adbPath) {
    cachedADBPath = adbPath;
    return adbPath;
  }

  // ADB not found
  throw new ADBError(
    'ADB executable not found. Please ensure ADB is installed and either:\n' +
      '1. Added to PATH environment variable, or\n' +
      '2. ANDROID_HOME/ANDROID_SDK_ROOT environment variable is set, or\n' +
      '3. ADB is installed in a standard location',
    {
      searchedPaths: [
        'PATH',
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        'common system locations',
      ].filter(Boolean),
    }
  );
}

/**
 * Clear the cached ADB path
 * Useful for testing or if ADB installation changes
 */
export function clearADBPathCache(): void {
  cachedADBPath = null;
}

/**
 * Get ADB version information
 */
export function getADBVersion(): string {
  const adbPath = resolveADBPath();

  try {
    const output = execSync(`"${adbPath}" version`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe',
    });

    return output.trim();
  } catch (error) {
    throw new ADBError('Failed to get ADB version', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
