/**
 * Input validation utilities for React Native MCP Server
 * Provides type-safe validation functions to ensure data integrity
 */

import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../errors/index.js';

/**
 * Validate that a value is a non-empty string
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} must be a non-empty string`,
      { value, fieldName }
    );
  }
}

/**
 * Validate that a file path exists and is accessible
 */
export function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string', { filePath });
  }

  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new ValidationError(`File or directory does not exist: ${absolutePath}`, {
      filePath,
      absolutePath,
    });
  }
}

/**
 * Validate that a file path exists and is a file (not a directory)
 */
export function validateFileExists(filePath: string): void {
  validateFilePath(filePath);

  const absolutePath = path.resolve(filePath);
  const stats = fs.statSync(absolutePath);

  if (!stats.isFile()) {
    throw new ValidationError(`Path is not a file: ${absolutePath}`, {
      filePath,
      absolutePath,
      isDirectory: stats.isDirectory(),
    });
  }
}

/**
 * Validate that a directory path exists and is a directory
 */
export function validateDirectoryExists(dirPath: string): void {
  validateFilePath(dirPath);

  const absolutePath = path.resolve(dirPath);
  const stats = fs.statSync(absolutePath);

  if (!stats.isDirectory()) {
    throw new ValidationError(`Path is not a directory: ${absolutePath}`, {
      dirPath,
      absolutePath,
      isFile: stats.isFile(),
    });
  }
}

/**
 * Validate code input with optional length constraints
 */
export function validateCodeInput(
  code: string,
  maxLength = 1000000
): asserts code is string {
  if (!code || typeof code !== 'string') {
    throw new ValidationError('Code must be a non-empty string', { code });
  }

  if (code.length > maxLength) {
    throw new ValidationError(
      `Code exceeds maximum length of ${maxLength} characters`,
      {
        codeLength: code.length,
        maxLength,
      }
    );
  }
}

/**
 * Validate React Native version format (e.g., "0.72.0")
 */
export function validateReactNativeVersion(version: string): void {
  const versionPattern = /^\d+\.\d+\.\d+$/;

  if (!versionPattern.test(version)) {
    throw new ValidationError(
      `Invalid React Native version format: ${version}. Expected format: X.Y.Z`,
      { version, expectedFormat: 'X.Y.Z' }
    );
  }

  // Validate version is reasonable (RN started at 0.0.1, currently < 1.0.0)
  const [major, minor] = version.split('.').map(Number);
  if (major < 0 || major > 1 || minor < 0 || minor > 999) {
    throw new ValidationError(`Invalid React Native version: ${version}`, {
      version,
      major,
      minor,
    });
  }
}

/**
 * Validate project structure (must have package.json with react-native dependency)
 */
export function validateProjectStructure(projectPath: string): void {
  validateDirectoryExists(projectPath);

  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new ValidationError(
      `Not a valid project: package.json not found in ${projectPath}`,
      { projectPath, packageJsonPath }
    );
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const hasReactNative =
      (packageJson.dependencies && packageJson.dependencies['react-native']) ||
      (packageJson.devDependencies && packageJson.devDependencies['react-native']);

    if (!hasReactNative) {
      throw new ValidationError(
        'Not a React Native project: react-native dependency not found in package.json',
        { projectPath, packageJsonPath }
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `Invalid package.json: ${error instanceof Error ? error.message : String(error)}`,
      { projectPath, packageJsonPath, originalError: error }
    );
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  enumValues: readonly T[],
  fieldName: string
): asserts value is T {
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${enumValues.join(', ')}`,
      {
        value,
        validValues: enumValues,
        fieldName,
      }
    );
  }
}

/**
 * Validate boolean value
 */
export function validateBoolean(
  value: unknown,
  fieldName: string
): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`, {
      value,
      fieldName,
      receivedType: typeof value,
    });
  }
}

/**
 * Validate number within range
 */
export function validateNumberInRange(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): asserts value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, {
      value,
      fieldName,
      receivedType: typeof value,
    });
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, {
      value,
      fieldName,
      min,
    });
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, {
      value,
      fieldName,
      max,
    });
  }
}

/**
 * Validate that a value is an array
 */
export function validateArray(
  value: unknown,
  fieldName: string
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, {
      value,
      fieldName,
      receivedType: typeof value,
    });
  }
}

/**
 * Validate optional value (if provided, must pass validator)
 */
export function validateOptional<T>(
  value: unknown,
  validator: (value: unknown) => asserts value is T
): value is T | undefined {
  if (value === undefined || value === null) {
    return true;
  }

  try {
    validator(value);
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate package name format
 */
export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new ValidationError('Package name must be a non-empty string', {
      packageName,
    });
  }

  // NPM package name rules
  const packageNamePattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

  if (!packageNamePattern.test(packageName)) {
    throw new ValidationError(
      `Invalid package name format: ${packageName}`,
      {
        packageName,
        expectedFormat: 'Valid npm package name',
      }
    );
  }
}

/**
 * Validate component name (must be valid React component name)
 */
export function validateComponentName(componentName: string): void {
  if (!componentName || typeof componentName !== 'string') {
    throw new ValidationError('Component name must be a non-empty string', {
      componentName,
    });
  }

  // React component must start with uppercase letter
  const componentNamePattern = /^[A-Z][a-zA-Z0-9]*$/;

  if (!componentNamePattern.test(componentName)) {
    throw new ValidationError(
      `Invalid component name: ${componentName}. Must start with uppercase letter and contain only alphanumeric characters`,
      {
        componentName,
        expectedFormat: 'PascalCase (e.g., MyComponent)',
      }
    );
  }
}

/**
 * Validate test type
 */
export const TEST_TYPES = [
  'unit',
  'integration',
  'e2e',
  'snapshot',
  'accessibility',
  'performance',
  'comprehensive',
] as const;

export type TestType = (typeof TEST_TYPES)[number];

export function validateTestType(testType: unknown): asserts testType is TestType {
  validateEnum(testType, TEST_TYPES, 'test_type');
}

/**
 * Validate focus areas for analysis
 */
export const FOCUS_AREAS = [
  'memory_usage',
  'list_rendering',
  'navigation',
  'animations',
  'bundle_size',
  'network',
  'accessibility',
  'security',
  'performance',
  'quality',
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];

export function validateFocusAreas(
  focusAreas: unknown
): asserts focusAreas is FocusArea[] {
  // Validate it's an array first
  if (!Array.isArray(focusAreas)) {
    throw new ValidationError('focus_areas must be an array', {
      focusAreas,
      receivedType: typeof focusAreas,
    });
  }

  // Validate each element
  focusAreas.forEach((element, index) => {
    try {
      validateEnum(element, FOCUS_AREAS, 'focus area');
    } catch (error) {
      throw new ValidationError(`Invalid focus area at index ${index}`, {
        element,
        index,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Validate update level
 */
export const UPDATE_LEVELS = ['patch', 'minor', 'major', 'all'] as const;

export type UpdateLevel = (typeof UPDATE_LEVELS)[number];

export function validateUpdateLevel(
  updateLevel: unknown
): asserts updateLevel is UpdateLevel {
  validateEnum(updateLevel, UPDATE_LEVELS, 'update_level');
}

/**
 * Validate remediation level
 */
export const REMEDIATION_LEVELS = ['basic', 'standard', 'expert'] as const;

export type RemediationLevel = (typeof REMEDIATION_LEVELS)[number];

export function validateRemediationLevel(
  level: unknown
): asserts level is RemediationLevel {
  validateEnum(level, REMEDIATION_LEVELS, 'remediation_level');
}

/**
 * Validate severity level
 */
export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low'] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export function validateSeverityLevel(
  severity: unknown
): asserts severity is SeverityLevel {
  validateEnum(severity, SEVERITY_LEVELS, 'severity');
}
