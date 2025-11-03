import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../../errors/index.js';
import * as validators from '../validators.js';

describe('Validators', () => {
  let tempDir: string;
  let tempFile: string;

  beforeAll(() => {
    // Create temp directory and file for testing
    tempDir = path.join(process.cwd(), '__test_temp__');
    tempFile = path.join(tempDir, 'test.txt');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(tempFile, 'test content');
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  describe('validateNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(() => validators.validateNonEmptyString('hello', 'test')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => validators.validateNonEmptyString('', 'test')).toThrow(ValidationError);
    });

    it('should reject whitespace-only strings', () => {
      expect(() => validators.validateNonEmptyString('   ', 'test')).toThrow(ValidationError);
    });

    it('should reject non-string values', () => {
      expect(() => validators.validateNonEmptyString(123, 'test')).toThrow(ValidationError);
      expect(() => validators.validateNonEmptyString(null, 'test')).toThrow(ValidationError);
      expect(() => validators.validateNonEmptyString(undefined, 'test')).toThrow(ValidationError);
    });
  });

  describe('validateFilePath', () => {
    it('should accept existing file paths', () => {
      expect(() => validators.validateFilePath(tempFile)).not.toThrow();
    });

    it('should accept existing directory paths', () => {
      expect(() => validators.validateFilePath(tempDir)).not.toThrow();
    });

    it('should reject non-existent paths', () => {
      expect(() => validators.validateFilePath('/nonexistent/path')).toThrow(ValidationError);
    });

    it('should reject empty paths', () => {
      expect(() => validators.validateFilePath('')).toThrow(ValidationError);
    });

    it('should reject non-string paths', () => {
      expect(() => validators.validateFilePath(123 as any)).toThrow(ValidationError);
    });
  });

  describe('validateFileExists', () => {
    it('should accept existing files', () => {
      expect(() => validators.validateFileExists(tempFile)).not.toThrow();
    });

    it('should reject directories', () => {
      expect(() => validators.validateFileExists(tempDir)).toThrow(ValidationError);
    });

    it('should reject non-existent files', () => {
      expect(() => validators.validateFileExists('/nonexistent/file.txt')).toThrow(ValidationError);
    });
  });

  describe('validateDirectoryExists', () => {
    it('should accept existing directories', () => {
      expect(() => validators.validateDirectoryExists(tempDir)).not.toThrow();
    });

    it('should reject files', () => {
      expect(() => validators.validateDirectoryExists(tempFile)).toThrow(ValidationError);
    });

    it('should reject non-existent directories', () => {
      expect(() => validators.validateDirectoryExists('/nonexistent/dir')).toThrow(ValidationError);
    });
  });

  describe('validateCodeInput', () => {
    it('should accept valid code strings', () => {
      expect(() => validators.validateCodeInput('const x = 1;')).not.toThrow();
    });

    it('should reject empty code', () => {
      expect(() => validators.validateCodeInput('')).toThrow(ValidationError);
    });

    it('should reject non-string code', () => {
      expect(() => validators.validateCodeInput(123 as any)).toThrow(ValidationError);
    });

    it('should reject code exceeding max length', () => {
      const longCode = 'x'.repeat(1000001);
      expect(() => validators.validateCodeInput(longCode)).toThrow(ValidationError);
    });

    it('should accept code within custom max length', () => {
      const code = 'x'.repeat(100);
      expect(() => validators.validateCodeInput(code, 100)).not.toThrow();
    });
  });

  describe('validateReactNativeVersion', () => {
    it('should accept valid versions', () => {
      expect(() => validators.validateReactNativeVersion('0.72.0')).not.toThrow();
      expect(() => validators.validateReactNativeVersion('0.73.5')).not.toThrow();
      expect(() => validators.validateReactNativeVersion('1.0.0')).not.toThrow();
    });

    it('should reject invalid formats', () => {
      expect(() => validators.validateReactNativeVersion('0.72')).toThrow(ValidationError);
      expect(() => validators.validateReactNativeVersion('v0.72.0')).toThrow(ValidationError);
      expect(() => validators.validateReactNativeVersion('0.72.0-rc1')).toThrow(ValidationError);
    });

    it('should reject unreasonable versions', () => {
      expect(() => validators.validateReactNativeVersion('2.0.0')).toThrow(ValidationError);
      expect(() => validators.validateReactNativeVersion('0.1000.0')).toThrow(ValidationError);
      expect(() => validators.validateReactNativeVersion('-1.0.0')).toThrow(ValidationError);
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum values', () => {
      const values = ['a', 'b', 'c'] as const;
      expect(() => validators.validateEnum('a', values, 'test')).not.toThrow();
    });

    it('should reject invalid enum values', () => {
      const values = ['a', 'b', 'c'] as const;
      expect(() => validators.validateEnum('d', values, 'test')).toThrow(ValidationError);
    });
  });

  describe('validateBoolean', () => {
    it('should accept boolean values', () => {
      expect(() => validators.validateBoolean(true, 'test')).not.toThrow();
      expect(() => validators.validateBoolean(false, 'test')).not.toThrow();
    });

    it('should reject non-boolean values', () => {
      expect(() => validators.validateBoolean('true', 'test')).toThrow(ValidationError);
      expect(() => validators.validateBoolean(1, 'test')).toThrow(ValidationError);
      expect(() => validators.validateBoolean(null, 'test')).toThrow(ValidationError);
    });
  });

  describe('validateNumberInRange', () => {
    it('should accept valid numbers', () => {
      expect(() => validators.validateNumberInRange(5, 'test')).not.toThrow();
    });

    it('should reject non-numbers', () => {
      expect(() => validators.validateNumberInRange('5', 'test')).toThrow(ValidationError);
      expect(() => validators.validateNumberInRange(NaN, 'test')).toThrow(ValidationError);
    });

    it('should enforce minimum', () => {
      expect(() => validators.validateNumberInRange(5, 'test', 10)).toThrow(ValidationError);
      expect(() => validators.validateNumberInRange(10, 'test', 10)).not.toThrow();
    });

    it('should enforce maximum', () => {
      expect(() => validators.validateNumberInRange(15, 'test', undefined, 10)).toThrow(
        ValidationError
      );
      expect(() => validators.validateNumberInRange(10, 'test', undefined, 10)).not.toThrow();
    });

    it('should enforce both min and max', () => {
      expect(() => validators.validateNumberInRange(5, 'test', 1, 10)).not.toThrow();
      expect(() => validators.validateNumberInRange(0, 'test', 1, 10)).toThrow(ValidationError);
      expect(() => validators.validateNumberInRange(11, 'test', 1, 10)).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should accept arrays', () => {
      expect(() => validators.validateArray([], 'test')).not.toThrow();
      expect(() => validators.validateArray([1, 2, 3], 'test')).not.toThrow();
    });

    it('should reject non-arrays', () => {
      expect(() => validators.validateArray('[]', 'test')).toThrow(ValidationError);
      expect(() => validators.validateArray({}, 'test')).toThrow(ValidationError);
      expect(() => validators.validateArray(null, 'test')).toThrow(ValidationError);
    });
  });

  describe('validateOptional', () => {
    it('should accept undefined', () => {
      expect(
        validators.validateOptional(undefined, (v) => {
          throw new Error('Should not be called');
        })
      ).toBe(true);
    });

    it('should accept null', () => {
      expect(
        validators.validateOptional(null, (v) => {
          throw new Error('Should not be called');
        })
      ).toBe(true);
    });

    it('should validate provided values', () => {
      expect(
        validators.validateOptional('test', (v): asserts v is string => {
          if (typeof v !== 'string') {
            throw new ValidationError('Must be string', {});
          }
        })
      ).toBe(true);
    });

    it('should throw for invalid provided values', () => {
      expect(() =>
        validators.validateOptional(123, (v): asserts v is string => {
          if (typeof v !== 'string') {
            throw new ValidationError('Must be string', {});
          }
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validatePackageName', () => {
    it('should accept valid package names', () => {
      expect(() => validators.validatePackageName('my-package')).not.toThrow();
      expect(() => validators.validatePackageName('my-package-name')).not.toThrow();
      expect(() => validators.validatePackageName('@scope/package')).not.toThrow();
    });

    it('should reject invalid package names', () => {
      expect(() => validators.validatePackageName('')).toThrow(ValidationError);
      expect(() => validators.validatePackageName('My-Package')).toThrow(ValidationError);
      expect(() => validators.validatePackageName('my package')).toThrow(ValidationError);
      expect(() => validators.validatePackageName(123 as any)).toThrow(ValidationError);
    });
  });

  describe('validateComponentName', () => {
    it('should accept valid component names', () => {
      expect(() => validators.validateComponentName('MyComponent')).not.toThrow();
      expect(() => validators.validateComponentName('Button')).not.toThrow();
      expect(() => validators.validateComponentName('MyComponent123')).not.toThrow();
    });

    it('should reject invalid component names', () => {
      expect(() => validators.validateComponentName('')).toThrow(ValidationError);
      expect(() => validators.validateComponentName('myComponent')).toThrow(ValidationError);
      expect(() => validators.validateComponentName('My-Component')).toThrow(ValidationError);
      expect(() => validators.validateComponentName('123Component')).toThrow(ValidationError);
      expect(() => validators.validateComponentName(123 as any)).toThrow(ValidationError);
    });
  });

  describe('validateTestType', () => {
    it('should accept valid test types', () => {
      expect(() => validators.validateTestType('unit')).not.toThrow();
      expect(() => validators.validateTestType('integration')).not.toThrow();
      expect(() => validators.validateTestType('e2e')).not.toThrow();
    });

    it('should reject invalid test types', () => {
      expect(() => validators.validateTestType('invalid')).toThrow(ValidationError);
    });
  });

  describe('validateFocusAreas', () => {
    it('should accept valid focus areas', () => {
      expect(() => validators.validateFocusAreas(['memory_usage'])).not.toThrow();
      expect(() => validators.validateFocusAreas(['memory_usage', 'performance'])).not.toThrow();
    });

    it('should reject non-arrays', () => {
      expect(() => validators.validateFocusAreas('memory_usage')).toThrow(ValidationError);
    });

    it('should reject invalid focus areas', () => {
      expect(() => validators.validateFocusAreas(['invalid'])).toThrow(ValidationError);
    });

    it('should provide index information for invalid elements', () => {
      expect(() => validators.validateFocusAreas(['memory_usage', 'invalid'])).toThrow(
        ValidationError
      );
    });
  });

  describe('validateUpdateLevel', () => {
    it('should accept valid update levels', () => {
      expect(() => validators.validateUpdateLevel('patch')).not.toThrow();
      expect(() => validators.validateUpdateLevel('minor')).not.toThrow();
      expect(() => validators.validateUpdateLevel('major')).not.toThrow();
      expect(() => validators.validateUpdateLevel('all')).not.toThrow();
    });

    it('should reject invalid update levels', () => {
      expect(() => validators.validateUpdateLevel('invalid')).toThrow(ValidationError);
    });
  });

  describe('validateRemediationLevel', () => {
    it('should accept valid remediation levels', () => {
      expect(() => validators.validateRemediationLevel('basic')).not.toThrow();
      expect(() => validators.validateRemediationLevel('standard')).not.toThrow();
      expect(() => validators.validateRemediationLevel('expert')).not.toThrow();
    });

    it('should reject invalid remediation levels', () => {
      expect(() => validators.validateRemediationLevel('invalid')).toThrow(ValidationError);
    });
  });

  describe('validateSeverityLevel', () => {
    it('should accept valid severity levels', () => {
      expect(() => validators.validateSeverityLevel('critical')).not.toThrow();
      expect(() => validators.validateSeverityLevel('high')).not.toThrow();
      expect(() => validators.validateSeverityLevel('medium')).not.toThrow();
      expect(() => validators.validateSeverityLevel('low')).not.toThrow();
    });

    it('should reject invalid severity levels', () => {
      expect(() => validators.validateSeverityLevel('invalid')).toThrow(ValidationError);
    });
  });

  describe('validateProjectStructure', () => {
    it('should accept valid React Native projects', () => {
      // Create a temp project with package.json containing react-native
      const testProjectDir = path.join(tempDir, 'test-rn-project');
      fs.mkdirSync(testProjectDir, { recursive: true });
      const packageJson = {
        name: 'test-app',
        dependencies: {
          'react-native': '0.72.0',
        },
      };
      fs.writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      expect(() => validators.validateProjectStructure(testProjectDir)).not.toThrow();

      // Cleanup
      fs.unlinkSync(path.join(testProjectDir, 'package.json'));
      fs.rmdirSync(testProjectDir);
    });

    it('should reject directories without package.json', () => {
      const emptyDir = path.join(tempDir, 'empty');
      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }
      expect(() => validators.validateProjectStructure(emptyDir)).toThrow(ValidationError);
      fs.rmdirSync(emptyDir);
    });

    it('should reject non-existent directories', () => {
      expect(() => validators.validateProjectStructure('/nonexistent/dir')).toThrow(
        ValidationError
      );
    });

    it('should reject projects without react-native dependency', () => {
      // Create a temp project without react-native
      const testProjectDir = path.join(tempDir, 'test-non-rn-project');
      fs.mkdirSync(testProjectDir, { recursive: true });
      const packageJson = {
        name: 'test-app',
        dependencies: {
          react: '18.0.0',
        },
      };
      fs.writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      expect(() => validators.validateProjectStructure(testProjectDir)).toThrow(ValidationError);

      // Cleanup
      fs.unlinkSync(path.join(testProjectDir, 'package.json'));
      fs.rmdirSync(testProjectDir);
    });
  });
});
