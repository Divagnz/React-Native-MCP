import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileScanner } from '../file-scanner.js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const rm = promisify(fs.rm);

describe('FileScanner', () => {
  const testDir = path.join(process.cwd(), 'test-temp-scanner');

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('findReactNativeFiles', () => {
    it('should find React Native component files', async () => {
      // Create React Native component
      const componentPath = path.join(testDir, 'MyComponent.tsx');
      await writeFile(
        componentPath,
        `import React from 'react';
import { View, Text } from 'react-native';

export const MyComponent = () => {
  return <View><Text>Hello</Text></View>;
};`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files).toContain(componentPath);
      expect(files.length).toBe(1);
    });

    it('should find multiple React Native files', async () => {
      // Create multiple components
      await writeFile(
        path.join(testDir, 'Component1.tsx'),
        `import React from 'react';
export const Component1 = () => <View />;`
      );
      await writeFile(
        path.join(testDir, 'Component2.js'),
        `import React from 'react';
export default function Component2() { return <View />; }`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(2);
    });

    it('should skip test files', async () => {
      await writeFile(
        path.join(testDir, 'Component.tsx'),
        `import React from 'react';
export const Component = () => <View />;`
      );
      await writeFile(
        path.join(testDir, 'Component.test.tsx'),
        `import React from 'react';
test('renders', () => {});`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(1);
      expect(files[0]).toContain('Component.tsx');
      expect(files[0]).not.toContain('.test.');
    });

    it('should skip node_modules directory', async () => {
      const nodeModulesDir = path.join(testDir, 'node_modules');
      await mkdir(nodeModulesDir, { recursive: true });
      await writeFile(
        path.join(nodeModulesDir, 'something.tsx'),
        `import React from 'react';
export const Something = () => <View />;`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });

    it('should skip build and dist directories', async () => {
      const buildDir = path.join(testDir, 'build');
      const distDir = path.join(testDir, 'dist');
      await mkdir(buildDir, { recursive: true });
      await mkdir(distDir, { recursive: true });

      await writeFile(
        path.join(buildDir, 'Component.js'),
        `import React from 'react'; export const Component = () => <View />;`
      );
      await writeFile(
        path.join(distDir, 'Component.js'),
        `import React from 'react'; export const Component = () => <View />;`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });

    it('should find files in nested directories', async () => {
      const srcDir = path.join(testDir, 'src', 'components');
      await mkdir(srcDir, { recursive: true });
      await writeFile(
        path.join(srcDir, 'NestedComponent.tsx'),
        `import React from 'react';
export const NestedComponent = () => <View />;`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(1);
      expect(files[0]).toContain('NestedComponent.tsx');
    });

    it('should skip non-React files', async () => {
      await writeFile(
        path.join(testDir, 'utils.ts'),
        `export function add(a: number, b: number) { return a + b; }`
      );
      await writeFile(
        path.join(testDir, 'config.js'),
        `module.exports = { apiUrl: 'https://example.com' };`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });

    it('should skip config files', async () => {
      await writeFile(
        path.join(testDir, 'babel.config.js'),
        `module.exports = { presets: ['babel-preset-expo'] };`
      );

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });

    it('should skip TypeScript declaration files', async () => {
      await writeFile(path.join(testDir, 'types.d.ts'), `declare module 'some-module';`);

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });
  });

  describe('findTestFiles', () => {
    it('should find test files with .test. extension', async () => {
      const testPath = path.join(testDir, 'Component.test.tsx');
      await writeFile(testPath, `test('works', () => {});`);

      const files = await FileScanner.findTestFiles(testDir);
      expect(files).toContain(testPath);
      expect(files.length).toBe(1);
    });

    it('should find test files with .spec. extension', async () => {
      const specPath = path.join(testDir, 'Component.spec.ts');
      await writeFile(specPath, `describe('Component', () => {});`);

      const files = await FileScanner.findTestFiles(testDir);
      expect(files).toContain(specPath);
      expect(files.length).toBe(1);
    });

    it('should find test files in __tests__ directory', async () => {
      const testsDir = path.join(testDir, '__tests__');
      await mkdir(testsDir, { recursive: true });
      const testPath = path.join(testsDir, 'component.test.tsx');
      await writeFile(testPath, `test('renders', () => {});`);

      const files = await FileScanner.findTestFiles(testDir);
      expect(files).toContain(testPath);
      expect(files.length).toBe(1);
    });

    it('should find multiple test files', async () => {
      await writeFile(path.join(testDir, 'test1.test.ts'), `test('1', () => {});`);
      await writeFile(path.join(testDir, 'test2.spec.ts'), `test('2', () => {});`);

      const testsDir = path.join(testDir, '__tests__');
      await mkdir(testsDir, { recursive: true });
      await writeFile(path.join(testsDir, 'test3.tsx'), `test('3', () => {});`);

      const files = await FileScanner.findTestFiles(testDir);
      expect(files.length).toBe(3);
    });

    it('should skip node_modules when finding test files', async () => {
      const nodeModulesDir = path.join(testDir, 'node_modules');
      await mkdir(nodeModulesDir, { recursive: true });
      await writeFile(path.join(nodeModulesDir, 'package.test.js'), `test('package', () => {});`);

      const files = await FileScanner.findTestFiles(testDir);
      expect(files.length).toBe(0);
    });

    it('should not find regular component files', async () => {
      await writeFile(
        path.join(testDir, 'Component.tsx'),
        `import React from 'react'; export const Component = () => <View />;`
      );

      const files = await FileScanner.findTestFiles(testDir);
      expect(files.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory', async () => {
      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files).toEqual([]);
    });

    it('should handle non-existent directory gracefully', async () => {
      const nonExistentDir = path.join(testDir, 'does-not-exist');
      const files = await FileScanner.findReactNativeFiles(nonExistentDir);
      expect(files).toEqual([]);
    });

    it('should handle directory with only hidden files', async () => {
      await writeFile(path.join(testDir, '.hidden.tsx'), `export const Hidden = () => <View />;`);

      const files = await FileScanner.findReactNativeFiles(testDir);
      expect(files.length).toBe(0);
    });
  });
});
