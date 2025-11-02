/**
 * Package upgrades analysis for React Native projects
 */

export interface PackageUpgradeIssue {
  file: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export class PackageUpgradesAnalyzer {
  /**
   * Analyze package.json for outdated or deprecated packages
   */
  static analyzePackageUpgrades(packageJson: any): PackageUpgradeIssue[] {
    const suggestions: PackageUpgradeIssue[] = [];

    if (!packageJson.dependencies && !packageJson.devDependencies) {
      return suggestions;
    }

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // React Native version
    if (dependencies['react-native']) {
      const version = dependencies['react-native'].replace(/[^0-9.]/g, '');
      const versionParts = version.split('.');
      // React Native uses 0.x versioning, so check the minor version
      const minorVersion = versionParts.length > 1 ? parseInt(versionParts[1]) : 0;
      if (minorVersion < 70) {
        suggestions.push({
          file: 'package.json',
          type: 'upgrades',
          severity: 'high',
          category: 'react_native_version',
          issue: `React Native ${version} is outdated`,
          suggestion: 'Upgrade to React Native 0.72+ for latest features and security fixes',
        });
      }
    }

    // Common deprecated packages
    const deprecatedPackages: Record<string, string> = {
      'react-native-vector-icons': '@expo/vector-icons or react-native-vector-icons (check latest)',
      'react-native-asyncstorage': '@react-native-async-storage/async-storage',
      'react-native-community/async-storage': '@react-native-async-storage/async-storage',
      '@react-native-community/netinfo': '@react-native-community/netinfo (check if latest)',
    };

    Object.keys(deprecatedPackages).forEach((pkg) => {
      if (dependencies[pkg]) {
        suggestions.push({
          file: 'package.json',
          type: 'upgrades',
          severity: 'medium',
          category: 'package_migration',
          issue: `${pkg} may be deprecated or have better alternatives`,
          suggestion: `Consider migrating to ${deprecatedPackages[pkg]}`,
        });
      }
    });

    // Expo SDK version check
    if (dependencies['expo']) {
      const expoVersion = dependencies['expo'].replace(/[^0-9.]/g, '');
      const expoMajor = parseInt(expoVersion.split('.')[0]);
      if (expoMajor < 48) {
        suggestions.push({
          file: 'package.json',
          type: 'upgrades',
          severity: 'medium',
          category: 'expo_version',
          issue: `Expo SDK ${expoVersion} is outdated`,
          suggestion: 'Upgrade to Expo SDK 48+ for better React Native compatibility',
        });
      }
    }

    // TypeScript version
    if (dependencies['typescript']) {
      const tsVersion = dependencies['typescript'].replace(/[^0-9.]/g, '');
      const tsMajor = parseInt(tsVersion.split('.')[0]);
      if (tsMajor < 5) {
        suggestions.push({
          file: 'package.json',
          type: 'upgrades',
          severity: 'low',
          category: 'typescript_version',
          issue: `TypeScript ${tsVersion} is outdated`,
          suggestion: 'Upgrade to TypeScript 5+ for latest features and improvements',
        });
      }
    }

    return suggestions;
  }
}
