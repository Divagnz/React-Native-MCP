import { describe, it, expect } from '@jest/globals';
import { PackageUpgradesAnalyzer } from '../package-upgrades-analyzer.js';

describe('PackageUpgradesAnalyzer', () => {
  describe('analyzePackageUpgrades', () => {
    describe('React Native version checks', () => {
      it('should detect outdated React Native version (0.65)', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.65.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBeGreaterThan(0);
        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeDefined();
        expect(rnIssue?.severity).toBe('high');
        expect(rnIssue?.issue).toContain('0.65');
        expect(rnIssue?.suggestion).toContain('0.72+');
      });

      it('should detect outdated React Native version (0.60)', () => {
        const packageJson = {
          dependencies: {
            'react-native': '^0.60.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeDefined();
        expect(rnIssue?.issue).toContain('0.60');
      });

      it('should not flag React Native 0.70+', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.72.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeUndefined();
      });

      it('should not flag React Native 0.73+', () => {
        const packageJson = {
          dependencies: {
            'react-native': '^0.73.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeUndefined();
      });

      it('should handle caret version syntax', () => {
        const packageJson = {
          dependencies: {
            'react-native': '^0.65.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeDefined();
      });

      it('should handle tilde version syntax', () => {
        const packageJson = {
          dependencies: {
            'react-native': '~0.68.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeDefined();
      });
    });

    describe('deprecated packages detection', () => {
      it('should detect react-native-vector-icons', () => {
        const packageJson = {
          dependencies: {
            'react-native-vector-icons': '9.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBeGreaterThan(0);
        const vectorIconsIssue = issues.find((i) => i.category === 'package_migration');
        expect(vectorIconsIssue).toBeDefined();
        expect(vectorIconsIssue?.severity).toBe('medium');
        expect(vectorIconsIssue?.issue).toContain('react-native-vector-icons');
        expect(vectorIconsIssue?.suggestion).toContain('@expo/vector-icons');
      });

      it('should detect react-native-asyncstorage', () => {
        const packageJson = {
          dependencies: {
            'react-native-asyncstorage': '1.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const asyncStorageIssue = issues.find((i) => i.issue.includes('react-native-asyncstorage'));
        expect(asyncStorageIssue).toBeDefined();
        expect(asyncStorageIssue?.suggestion).toContain(
          '@react-native-async-storage/async-storage'
        );
      });

      it('should detect @react-native-community/async-storage', () => {
        const packageJson = {
          dependencies: {
            'react-native-community/async-storage': '1.12.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const asyncStorageIssue = issues.find((i) =>
          i.issue.includes('react-native-community/async-storage')
        );
        expect(asyncStorageIssue).toBeDefined();
      });

      it('should detect @react-native-community/netinfo', () => {
        const packageJson = {
          dependencies: {
            '@react-native-community/netinfo': '5.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const netinfoIssue = issues.find((i) =>
          i.issue.includes('@react-native-community/netinfo')
        );
        expect(netinfoIssue).toBeDefined();
      });

      it('should detect multiple deprecated packages', () => {
        const packageJson = {
          dependencies: {
            'react-native-vector-icons': '9.0.0',
            'react-native-asyncstorage': '1.0.0',
            '@react-native-community/netinfo': '5.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const deprecatedIssues = issues.filter((i) => i.category === 'package_migration');
        expect(deprecatedIssues.length).toBe(3);
      });
    });

    describe('Expo SDK version checks', () => {
      it('should detect outdated Expo SDK (47)', () => {
        const packageJson = {
          dependencies: {
            expo: '~47.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBeGreaterThan(0);
        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue).toBeDefined();
        expect(expoIssue?.severity).toBe('medium');
        expect(expoIssue?.issue).toContain('47');
        expect(expoIssue?.suggestion).toContain('48+');
      });

      it('should detect outdated Expo SDK (45)', () => {
        const packageJson = {
          dependencies: {
            expo: '^45.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue).toBeDefined();
        expect(expoIssue?.issue).toContain('45');
      });

      it('should not flag Expo SDK 48+', () => {
        const packageJson = {
          dependencies: {
            expo: '~48.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue).toBeUndefined();
      });

      it('should not flag Expo SDK 49+', () => {
        const packageJson = {
          dependencies: {
            expo: '^49.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue).toBeUndefined();
      });

      it('should handle Expo version in devDependencies', () => {
        const packageJson = {
          devDependencies: {
            expo: '~47.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue).toBeDefined();
      });
    });

    describe('TypeScript version checks', () => {
      it('should detect outdated TypeScript (4.x)', () => {
        const packageJson = {
          devDependencies: {
            typescript: '^4.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBeGreaterThan(0);
        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue).toBeDefined();
        expect(tsIssue?.severity).toBe('low');
        expect(tsIssue?.issue).toContain('4.9');
        expect(tsIssue?.suggestion).toContain('5+');
      });

      it('should detect outdated TypeScript (3.x)', () => {
        const packageJson = {
          devDependencies: {
            typescript: '~3.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue).toBeDefined();
        expect(tsIssue?.issue).toContain('3.9');
      });

      it('should not flag TypeScript 5+', () => {
        const packageJson = {
          devDependencies: {
            typescript: '^5.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue).toBeUndefined();
      });

      it('should not flag TypeScript 5.3+', () => {
        const packageJson = {
          devDependencies: {
            typescript: '~5.3.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue).toBeUndefined();
      });

      it('should handle TypeScript in dependencies', () => {
        const packageJson = {
          dependencies: {
            typescript: '^4.8.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue).toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('should return empty array for package.json without dependencies', () => {
        const packageJson = {
          name: 'my-app',
          version: '1.0.0',
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues).toEqual([]);
      });

      it('should return empty array for empty dependencies', () => {
        const packageJson = {
          dependencies: {},
          devDependencies: {},
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues).toEqual([]);
      });

      it('should handle modern package.json with no issues', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.73.0',
            expo: '~49.0.0',
            react: '18.2.0',
          },
          devDependencies: {
            typescript: '^5.2.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues).toEqual([]);
      });

      it('should check both dependencies and devDependencies', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.65.0',
            expo: '~47.0.0',
          },
          devDependencies: {
            typescript: '^4.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBe(3);

        const categories = issues.map((i) => i.category);
        expect(categories).toContain('react_native_version');
        expect(categories).toContain('expo_version');
        expect(categories).toContain('typescript_version');
      });

      it('should detect all issue types in one package.json', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.65.0',
            'react-native-vector-icons': '9.0.0',
            'react-native-asyncstorage': '1.0.0',
            expo: '~45.0.0',
          },
          devDependencies: {
            typescript: '^4.8.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBeGreaterThanOrEqual(5);

        // Should have all categories
        const categories = [...new Set(issues.map((i) => i.category))];
        expect(categories).toContain('react_native_version');
        expect(categories).toContain('package_migration');
        expect(categories).toContain('expo_version');
        expect(categories).toContain('typescript_version');
      });

      it('should handle package.json with only devDependencies', () => {
        const packageJson = {
          devDependencies: {
            typescript: '^4.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        expect(issues.length).toBe(1);
        expect(issues[0].category).toBe('typescript_version');
      });

      it('should handle version strings with various formats', () => {
        const packageJson = {
          dependencies: {
            'react-native': 'v0.65.0',
            expo: 'SDK 47.0.0',
            typescript: 'latest-4.9',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        // Should still extract version numbers correctly
        expect(issues.length).toBeGreaterThan(0);
      });

      it('should handle exact version numbers without symbols', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.68.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue).toBeDefined();
      });
    });

    describe('suggestion messages', () => {
      it('should provide helpful suggestion for React Native upgrade', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.65.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue?.suggestion).toContain('0.72+');
        expect(rnIssue?.suggestion).toContain('security fixes');
      });

      it('should provide helpful suggestion for deprecated packages', () => {
        const packageJson = {
          dependencies: {
            'react-native-asyncstorage': '1.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const storageIssue = issues.find((i) => i.category === 'package_migration');
        expect(storageIssue?.suggestion).toContain('migrating');
        expect(storageIssue?.suggestion).toContain('@react-native-async-storage/async-storage');
      });

      it('should provide helpful suggestion for Expo upgrade', () => {
        const packageJson = {
          dependencies: {
            expo: '~45.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue?.suggestion).toContain('48+');
        expect(expoIssue?.suggestion).toContain('compatibility');
      });

      it('should provide helpful suggestion for TypeScript upgrade', () => {
        const packageJson = {
          devDependencies: {
            typescript: '^4.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue?.suggestion).toContain('5+');
        expect(tsIssue?.suggestion).toContain('latest features');
      });
    });

    describe('severity levels', () => {
      it('should mark React Native version as high severity', () => {
        const packageJson = {
          dependencies: {
            'react-native': '0.65.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const rnIssue = issues.find((i) => i.category === 'react_native_version');
        expect(rnIssue?.severity).toBe('high');
      });

      it('should mark deprecated packages as medium severity', () => {
        const packageJson = {
          dependencies: {
            'react-native-vector-icons': '9.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const pkgIssue = issues.find((i) => i.category === 'package_migration');
        expect(pkgIssue?.severity).toBe('medium');
      });

      it('should mark Expo version as medium severity', () => {
        const packageJson = {
          dependencies: {
            expo: '~45.0.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const expoIssue = issues.find((i) => i.category === 'expo_version');
        expect(expoIssue?.severity).toBe('medium');
      });

      it('should mark TypeScript version as low severity', () => {
        const packageJson = {
          devDependencies: {
            typescript: '^4.9.0',
          },
        };

        const issues = PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson);

        const tsIssue = issues.find((i) => i.category === 'typescript_version');
        expect(tsIssue?.severity).toBe('low');
      });
    });
  });
});
